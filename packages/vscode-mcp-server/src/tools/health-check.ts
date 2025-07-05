import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,HealthCheckInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...HealthCheckInputSchema.shape
};

export function registerHealthCheck(server: McpServer) {
  server.registerTool("health_check", {
    title: "Health Check",
    description: "Check if VSCode extension is running and healthy",
    inputSchema
  }, async ({ workspace_path }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("health", {});
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 