import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher } from "@vscode-mcp/vscode-mcp-ipc";

import { formatToolCallError } from "./format-tool-call-error.js";
import { jsonSchemaToZodShape } from "./json-schema-to-zod.js";

// Intervals (ms) at which to re-sync after startup, to catch late-activating extensions.
// After the list is exhausted, syncs every STEADY_STATE_INTERVAL_MS.
const STARTUP_SYNC_INTERVALS = [0, 2_000, 5_000, 15_000, 30_000];
const STEADY_STATE_INTERVAL_MS = 60_000;

type DynamicToolHandle = ReturnType<McpServer['registerTool']>;
interface ExtensionToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

function makeDynamicToolHandle(
  server: McpServer,
  workspacePath: string,
  tool: ExtensionToolInfo,
): DynamicToolHandle {
  const outputSchema = tool.outputSchema ? jsonSchemaToZodShape(tool.outputSchema) : undefined;
  return server.registerTool(tool.name, {
    description: tool.description,
    inputSchema: jsonSchemaToZodShape(tool.inputSchema),
    ...(outputSchema && { outputSchema }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  }, async (params) => {
    try {
      const disp = await createDispatcher(workspacePath);
      const result = await disp.dispatch('callExtensionTool', {
        name: tool.name,
        input: params as Record<string, unknown>,
      });
      return {
        ...(outputSchema && { structuredContent: result.result as Record<string, unknown> }),
        content: [{ type: 'text' as const, text: JSON.stringify(result.result, null, 2) }],
      };
    } catch (error) {
      return formatToolCallError(tool.name, error);
    }
  });
}

async function syncExtensionTools(
  server: McpServer,
  workspacePath: string,
  handles: Map<string, DynamicToolHandle>,
  context: { firstSync: boolean },
): Promise<void> {
  let tools: ExtensionToolInfo[];
  try {
    const dispatcher = await createDispatcher(workspacePath);
    ({ tools } = await dispatcher.dispatch('listExtensionTools', {}));
  } catch (error) {
    if (context.firstSync) {
      // Only log on the first failure so we don't spam on every poll cycle.
      console.error(
        `⚠️  Extension tool sync failed for workspace: ${workspacePath}\n` +
        `   Reason: ${(error as Error).message}\n` +
        `   Will retry on subsequent sync cycles.`,
      );
    }
    return;
  }
  context.firstSync = false;

  const newNames = new Set(tools.map(t => t.name));

  // Remove tools that are no longer registered in the extension.
  for (const [name, handle] of handles) {
    if (!newNames.has(name)) {
      handle.remove();
      handles.delete(name);
      console.error(`🔌 Removed extension tool: ${name}`);
    }
  }

  // Register new tools; update schema/description for existing ones.
  for (const tool of tools) {
    const existing = handles.get(tool.name);
    if (existing) {
      const outputSchema = tool.outputSchema ? jsonSchemaToZodShape(tool.outputSchema) : undefined;
      existing.update({
        description: tool.description,
        paramsSchema: jsonSchemaToZodShape(tool.inputSchema),
        ...(outputSchema && { outputSchema }),
      });
    } else {
      handles.set(tool.name, makeDynamicToolHandle(server, workspacePath, tool));
      console.error(`🔌 Registered extension tool: ${tool.name}`);
    }
  }
}

/**
 * Start background sync that periodically pulls the list of tools registered by
 * other VSCode extensions and keeps the MCP server's tool registry in sync.
 *
 * Uses a back-off schedule to quickly catch late-activating extensions, then
 * settles into a steady-state interval. McpServer automatically emits
 * `notifications/tools/list_changed` whenever tools are added or removed.
 *
 * The schedule advances unconditionally — even if a sync cycle throws — so the
 * chain is never broken by a transient error.
 */
export function startExtensionToolsSync(server: McpServer, workspacePath: string): void {
  const handles = new Map<string, DynamicToolHandle>();
  const context = { firstSync: true };
  let stepIdx = 0;

  const run = () => syncExtensionTools(server, workspacePath, handles, context).catch((error) => {
    console.error(`Error syncing extension tools: ${error}`);
   });

  const scheduleNext = () => {
    if (stepIdx < STARTUP_SYNC_INTERVALS.length) {
      setTimeout(() => {
        stepIdx++;
        scheduleNext();
        run();
      }, STARTUP_SYNC_INTERVALS[stepIdx]);
    } else {
      setInterval(run, STEADY_STATE_INTERVAL_MS);
    }
  };

  scheduleNext();
}
