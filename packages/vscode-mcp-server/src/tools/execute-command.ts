import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, ExecuteCommandInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...ExecuteCommandInputSchema.shape
};

export function registerExecuteCommand(server: McpServer) {
  server.registerTool("execute_command", {
    title: "⚠️ Execute VSCode Command",
    description: "⚠️ DANGER: Execute arbitrary VSCode commands. This tool can modify files, change settings, or trigger any VSCode action. SECURITY WARNING: Only use with trusted inputs.",
    inputSchema,
    annotations: {
      title: "⚠️ Execute VSCode Command",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, command, args }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("executeCommand", { command, args });
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Execute Command", error);
    }
  });
} 