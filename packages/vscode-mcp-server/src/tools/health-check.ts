import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, HealthCheckInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...HealthCheckInputSchema.shape
};

const DESCRIPTION = `Verify VSCode extension connectivity and readiness for AI coding operations.

**AI Coding Agent Use Cases:**
- Confirm MCP connection before starting coding sessions
- Diagnose issues when other tools fail to respond
- Validate multi-workspace setup for complex projects
- Ensure reliable tool availability for AI workflows

**Parameter Examples:**
- Basic check: workspace_path: '/path/to/workspace'
- Multi-workspace validation: workspace_path: '/path/to/different/workspace'

**Return Format:**
Health and connection status information

**AI Coding Agent Benefits:**
- Prevent tool failures with proactive health checks
- Ensure reliable AI coding workflows
- Quick troubleshooting for connection issues
- Validate workspace-specific tool availability

**Important Notes:**
- Each workspace has its own extension instance and socket
- Useful for troubleshooting before running other MCP tools
- Returns detailed connection and extension status information
- Should be the first tool to test when setting up new workspaces`;

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