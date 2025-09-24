import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { VscodeMcpToolName } from "./constants.js";

import {
  registerCallAgent,
  registerExecuteCommand,
  registerGetDiagnostics,
  registerGetReferences,
  registerGetSymbolLSPInfo,
  registerHealthCheck,
  registerListWorkspaces,
  registerOpenFiles,
  registerRenameSymbol,
} from "./tools/index.js";

// Tool registration mapping
type ToolRegistrationFunction = (server: McpServer, ...args: any[]) => void;

const TOOL_REGISTRY: Record<string, ToolRegistrationFunction> = {
  [VscodeMcpToolName.CALL_AGENT]: registerCallAgent,
  [VscodeMcpToolName.HEALTH_CHECK]: (server: McpServer, version: string) => registerHealthCheck(server, version),
  [VscodeMcpToolName.GET_DIAGNOSTICS]: registerGetDiagnostics,
  [VscodeMcpToolName.GET_SYMBOL_LSP_INFO]: registerGetSymbolLSPInfo,
  [VscodeMcpToolName.GET_REFERENCES]: registerGetReferences,
  [VscodeMcpToolName.EXECUTE_COMMAND]: registerExecuteCommand,
  [VscodeMcpToolName.OPEN_FILES]: registerOpenFiles,
  [VscodeMcpToolName.RENAME_SYMBOL]: registerRenameSymbol,
  [VscodeMcpToolName.LIST_WORKSPACES]: registerListWorkspaces,
};

/**
 * Create and configure the VSCode MCP Server
 */
export function createVSCodeMCPServer(
  name: string,
  version: string,
  disabledTools: string[] = []
): McpServer {
  const server = new McpServer({
    name,
    version
  });

  const disabledSet = new Set(disabledTools);
  const registeredTools: string[] = [];
  const skippedTools: string[] = [];

  // Register tools conditionally
  for (const [toolName, registerFunction] of Object.entries(TOOL_REGISTRY)) {
    if (disabledSet.has(toolName)) {
      skippedTools.push(toolName);
    } else {
      if (toolName === VscodeMcpToolName.HEALTH_CHECK) {
        registerFunction(server, version);
      } else {
        registerFunction(server);
      }
      registeredTools.push(toolName);
    }
  }

  // Log registration results
  console.error(`✅ Registered tools: ${registeredTools.join(', ')}`);
  if (skippedTools.length > 0) {
    console.error(`⏭️  Skipped tools: ${skippedTools.join(', ')}`);
  }

  return server;
} 