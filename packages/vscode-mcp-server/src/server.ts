import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAllTools } from '@vscode-mcp/vscode-mcp-core';

import { registerCoreTool } from './adapter.js';

/**
 * Create and configure the VSCode MCP Server.
 */
export function createVSCodeMCPServer(
  name: string,
  version: string,
  enabledTools: string[] = [],
  disabledTools: string[] = [],
): McpServer {
  const server = new McpServer({ name, version });

  const enabledSet = new Set(enabledTools);
  const disabledSet = new Set(disabledTools);
  const registeredTools: string[] = [];
  const skippedTools: string[] = [];

  for (const tool of getAllTools({ clientVersion: version })) {
    const shouldRegister =
      (enabledTools.length === 0 || enabledSet.has(tool.name)) && !disabledSet.has(tool.name);

    if (!shouldRegister) {
      skippedTools.push(tool.name);
      continue;
    }

    registerCoreTool(server, tool);
    registeredTools.push(tool.name);
  }

  console.error(`✅ Registered tools: ${registeredTools.join(', ')}`);
  if (skippedTools.length > 0) {
    console.error(`⏭️  Skipped tools: ${skippedTools.join(', ')}`);
  }

  return server;
}
