import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,GetDiagnosticsInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetDiagnosticsInputSchema.shape
};

export function registerGetDiagnostics(server: McpServer) {
  server.registerTool("get_diagnostics", {
    title: "Get Diagnostics",
    description: "Get diagnostic information for a file",
    inputSchema
  }, async ({ workspace_path, uri }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("getDiagnostics", { uri });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 