import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, HealthCheckInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...HealthCheckInputSchema.shape
};

const DESCRIPTION = `Verify VSCode extension connectivity and readiness for AI coding operations. Supports all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Confirm MCP connection before starting coding sessions to avoid tool failures
- Quick health check when other tools return unexpected errors or timeouts
- Validate multi-workspace setup for complex projects with multiple repositories
- Test workspace targeting when switching between different project folders
- Troubleshoot extension connectivity issues during development setup

**Parameter Examples:**
- Basic check: workspace_path: '/path/to/workspace'
- Multi-workspace validation: workspace_path: '/path/to/different/workspace'

**Return Format:**
Health and connection status information

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