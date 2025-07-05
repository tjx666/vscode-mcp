import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher,GetReferencesInputSchema  } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetReferencesInputSchema.shape
};

export function registerGetReferences(server: McpServer) {
  server.registerTool("get_references", {
    title: "Get References",
    description: "Get reference locations for a symbol at a specific position",
    inputSchema
  }, async ({ workspace_path, uri, line, character, includeDeclaration }) => {
    // 完整的类型推导！
    const dispatcher = createDispatcher(workspace_path);
    const result = await dispatcher.dispatch("getReferences", { 
      uri, 
      line, 
      character, 
      includeDeclaration 
    });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
} 