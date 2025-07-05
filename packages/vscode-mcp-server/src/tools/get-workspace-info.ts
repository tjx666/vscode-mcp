import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,GetWorkspaceInfoInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetWorkspaceInfoInputSchema.shape
};

export function registerGetWorkspaceInfo(server: McpServer) {
  server.registerTool("get_workspace_info", {
    title: "Get Workspace Info",
    description: "Get workspace information including folders and settings",
    inputSchema
  }, async ({ workspace_path }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("getWorkspaceInfo", {});
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 