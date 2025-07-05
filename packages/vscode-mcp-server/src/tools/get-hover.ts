import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,GetHoverInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetHoverInputSchema.shape
};

export function registerGetHover(server: McpServer) {
  server.registerTool("get_hover", {
    title: "Get Hover",
    description: "Get hover information for a symbol at a specific position",
    inputSchema
  }, async ({ workspace_path, uri, line, character }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("getHover", { uri, line, character });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 