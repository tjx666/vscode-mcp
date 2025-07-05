import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetReferencesInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetReferencesInputSchema.shape
};

export function registerGetReferences(server: McpServer) {
  server.registerTool("get_references", {
    title: "Get References",
    description: "Get reference locations for a symbol at a specific position",
    inputSchema,
    annotations: {
      title: "Get References",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, uri, line, character, includeDeclaration }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getReferences", { 
        uri, 
        line, 
        character, 
        includeDeclaration 
      });
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Get References", error);
    }
  });
} 