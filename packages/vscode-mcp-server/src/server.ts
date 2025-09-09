import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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
  registerGetDiagnostics(server);
  registerGetSymbolLSPInfo(server);
  registerGetReferences(server);
  registerExecuteCommand(server);
  registerOpenFiles(server);
  registerRenameSymbol(server);
  registerListWorkspaces(server);

  return server;
} 