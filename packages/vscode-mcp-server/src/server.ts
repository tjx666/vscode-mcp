import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  registerExecuteCommand,
  registerGetDefinition,
  registerGetDiagnostics,
  registerGetHover,
  registerGetReferences,
  registerGetSignatureHelp,
  registerHealthCheck,
  registerOpenDiff,
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
  registerExecuteCommand(server);
  registerOpenDiff(server);
  registerOpenFiles(server);

  return server;
} 