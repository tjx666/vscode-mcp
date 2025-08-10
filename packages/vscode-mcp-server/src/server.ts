import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  registerCallAgent,
  registerExecuteCommand,
  registerGetCommands,
  registerGetDiagnostics,
  registerGetReferences,
  registerGetSymbolLSPInfo,
  registerHealthCheck,
  registerHighlightCode,
  registerListWorkspaces,
  registerOpenDiff,
  registerOpenFiles,
  registerRenameSymbol,
} from "./tools/index.js";

/**
 * Create and configure the VSCode MCP Server
 */
export function createVSCodeMCPServer(name: string, version: string): McpServer {
  const server = new McpServer({
    name,
    version
  });

  // Register all tools
  registerCallAgent(server);
  registerHealthCheck(server, version);
  registerHighlightCode(server);
  registerGetDiagnostics(server);
  registerGetSymbolLSPInfo(server);
  registerGetCommands(server);
  registerGetReferences(server);
  registerExecuteCommand(server);
  registerOpenDiff(server);
  registerOpenFiles(server);
  registerRenameSymbol(server);
  registerListWorkspaces(server);

  return server;
} 