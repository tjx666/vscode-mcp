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

export function registerHealthCheck(server: McpServer) {
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
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Health Check", error);
    }
  });
} 