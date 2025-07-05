import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,ExecuteCommandInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...ExecuteCommandInputSchema.shape
};

export function registerExecuteCommand(server: McpServer) {
  server.registerTool("execute_command", {
    title: "Execute Command",
    description: "Execute a VSCode command",
    inputSchema
  }, async ({ workspace_path, command, args }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("executeCommand", { command, args });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 