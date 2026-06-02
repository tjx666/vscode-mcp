import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnyToolDefinition } from '@vscode-mcp/vscode-mcp-core';
import { z } from 'zod';

const workspacePathSchema = z
  .string()
  .describe(
    'Absolute path of the open VSCode workspace folder that runs the VSCode MCP Bridge extension. This value selects the VSCode socket, so it must match the workspace shown by list_workspaces or the extension activation log. Do not pass a child project or submodule path unless VSCode is opened at that path.',
  );

/**
 * Register a core `ToolDefinition` on an `McpServer`. Wraps `handler` so
 * thrown errors become `{ isError: true, ... }` responses per the MCP spec,
 * and prepends each tool's title (and optional `errorTips`) to the message.
 */
export function registerCoreTool(server: McpServer, tool: AnyToolDefinition): void {
  const inputSchema = tool.requiresWorkspace
    ? { workspace_path: workspacePathSchema, ...tool.schema.shape }
    : { ...tool.schema.shape };

  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema,
      annotations: {
        title: tool.title,
        readOnlyHint: tool.annotations.readOnlyHint,
        destructiveHint: tool.annotations.destructiveHint,
        idempotentHint: tool.annotations.idempotentHint,
        openWorldHint: tool.annotations.openWorldHint,
      },
    },
    async (args: Record<string, unknown>) => {
      const { workspace_path, ...params } = args as { workspace_path?: string } & Record<string, unknown>;
      try {
        const text = await tool.handler(params as any, {
          workspacePath: workspace_path ?? '',
        });
        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `❌ ${tool.title} failed: ${String(error)}${tool.errorTips ? `\n\n${tool.errorTips}` : ''}`,
            },
          ],
        };
      }
    },
  );
}
