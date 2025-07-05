import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  registerExecuteCommand,
  registerGetDefinition,
  registerGetDiagnostics,
  registerGetHover,
  registerGetReferences,
  registerGetSignatureHelp,
  registerGetWorkspaceInfo,
  registerGetWorkspaceSymbols,
  registerHealthCheck,
  registerOpenFiles} from "./tools/index.js";

/**
 * Create and configure the VSCode MCP Server
 */
export function createVSCodeMCPServer(name: string, version: string): McpServer {
  const server = new McpServer({
    name,
    version
  });

  // Register all tools
  registerHealthCheck(server);
  registerGetDiagnostics(server);
  registerGetDefinition(server);
  registerGetReferences(server);
  registerGetHover(server);
  registerGetSignatureHelp(server);
  registerGetWorkspaceInfo(server);
  registerGetWorkspaceSymbols(server);
  registerExecuteCommand(server);
  registerOpenFiles(server);

  return server;
} 