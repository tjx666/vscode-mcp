import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetSignatureHelpInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetSignatureHelpInputSchema.shape
};

export function registerGetSignatureHelp(server: McpServer) {
  server.registerTool("get_signature_help", {
    title: "Get Signature Help",
    description: "Get signature help for a function call at a specific position",
    inputSchema,
    annotations: {
      title: "Get Signature Help",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, uri, line, character }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getSignatureHelp", { uri, line, character });
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Get Signature Help", error);
    }
  });
} 