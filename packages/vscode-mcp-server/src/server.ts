import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  registerCallAgent,
  registerExecuteCommand,
  registerGetCommands,
  registerGetDefinition,
  registerGetDiagnostics,
  registerGetHovers,
  registerGetReferences,
  registerGetSignatureHelp,
  registerHealthCheck,
  registerHighlightCode,
  registerListWorkspaces,
  registerOpenDiff,
  registerOpenFiles,
  registerRenameSymbol,
  registerRequestInput} from "./tools/index.js";

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
  registerGetCommands(server);
  registerGetDefinition(server);
  registerGetReferences(server);
  registerGetHovers(server);
  registerGetSignatureHelp(server);
  registerExecuteCommand(server);
  registerOpenDiff(server);
  registerOpenFiles(server);
  registerRenameSymbol(server);
  registerRequestInput(server);
  registerListWorkspaces(server);

  return server;
} 