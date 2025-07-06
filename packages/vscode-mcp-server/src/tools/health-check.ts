import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, HealthCheckInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...HealthCheckInputSchema.shape
};

const DESCRIPTION = `Test connection to VSCode MCP Bridge extension. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**Core Function:**
All VSCode MCP tools depend on VSCode MCP Bridge extension to function. This tool verifies the connection.

**AI Coding Agent Use Cases:**
- Troubleshoot when other VSCode MCP tools return connection errors or timeouts

**Parameter Examples:**
- Basic check: workspace_path: '/path/to/workspace'

**Return Format:**
JSON object with connection status and diagnostic details

**Important Notes:**
- Only use when other VSCode MCP tools are failing
- If connection fails, inform user to manually check: 1) VSCode MCP Bridge extension is installed and activated (https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge), 2) Extension output in VSCode Output panel → "VSCode MCP Bridge"`;

export function registerHealthCheck(server: McpServer, serverVersion: string) {
  server.registerTool("health_check", {
    title: "Health Check",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Health Check",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("health", {});
      
      // Version compatibility check
      const versionMatch = result.extension_version === serverVersion;
      const statusIcon = result.status === 'ok' ? '✅' : '❌';
      const versionIcon = versionMatch ? '✅' : '⚠️';
      
      let statusMessage = `${statusIcon} Health Check Result:\n`;
      statusMessage += `  • Status: ${result.status}\n`;
      statusMessage += `  • Extension Version: ${result.extension_version}\n`;
      statusMessage += `  • Server Version: ${serverVersion}\n`;
      statusMessage += `  • ${versionIcon} Version Match: ${versionMatch ? 'Yes' : 'No'}\n`;
      statusMessage += `  • Workspace: ${result.workspace || 'None'}\n`;
      statusMessage += `  • Timestamp: ${result.timestamp}\n`;
      
      if (result.system_info) {
        statusMessage += `  • Platform: ${result.system_info.platform}\n`;
        statusMessage += `  • Node.js: ${result.system_info.node_version}\n`;
        if (result.system_info.vscode_version) {
          statusMessage += `  • VSCode: ${result.system_info.vscode_version}\n`;
        }
      }
      
      if (result.error) {
        statusMessage += `  • Error: ${result.error}\n`;
      }
      
      if (!versionMatch) {
        statusMessage += `\n⚠️  Warning: Version mismatch detected!\n`;
        statusMessage += `   This may cause compatibility issues. Please update both components to the same version:\n\n`;
        statusMessage += `   📦 Update MCP Server:\n`;
        statusMessage += `   npx @vscode-mcp/vscode-mcp-server@latest --version\n\n`;
        statusMessage += `   🔌 Update VSCode Extension:\n`;
        statusMessage += `   Please update the "VSCode MCP Bridge" extension (YuTengjing.vscode-mcp-bridge) to the latest version in VSCode Extensions marketplace\n\n`;
        statusMessage += `   🔄 Important: After updating both components, please restart your editor to ensure the changes take effect.`;
      }
      
      return {
        content: [{
          type: "text",
          text: statusMessage
        }]
      };
    } catch (error) {
      return formatToolCallError("Health Check", error);
    }
  });
} 