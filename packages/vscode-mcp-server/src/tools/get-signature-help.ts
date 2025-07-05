import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,GetSignatureHelpInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetSignatureHelpInputSchema.shape
};

export function registerGetSignatureHelp(server: McpServer) {
  server.registerTool("get_signature_help", {
    title: "Get Signature Help",
    description: "Get signature help for a function call at a specific position",
    inputSchema
  }, async ({ workspace_path, uri, line, character }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("getSignatureHelp", { uri, line, character });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 