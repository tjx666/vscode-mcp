import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,GetWorkspaceSymbolsInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetWorkspaceSymbolsInputSchema.shape
};

export function registerGetWorkspaceSymbols(server: McpServer) {
  server.registerTool("get_workspace_symbols", {
    title: "Get Workspace Symbols",
    description: "Search for symbols in the workspace",
    inputSchema
  }, async ({ workspace_path, query }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("getWorkspaceSymbols", { query });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 