import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, ExecuteCommandInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...ExecuteCommandInputSchema.shape
};

const DESCRIPTION = `⚠️ Execute VSCode commands with arguments - DANGEROUS tool that can modify workspace, settings, or trigger harmful operations.

**Arguments Format:**
- args parameter must be a JSON string representing an array of arguments
- Example: '["file:///path/to/file.ts"]' for opening a file
- Example: '[]' for commands without arguments

**Common Use Cases:**
- Format code: 'editor.action.formatDocument' with args: '[]'
- Open files: 'vscode.open' with args: '["file:///path/to/file.ts"]'
- Save all files: 'workbench.action.files.saveAll' with args: '[]'
- Auto-fix issues: 'editor.action.fixAll' with args: '[]'
- Restart TypeScript: 'typescript.restartTsServer' with args: '[]'
- Restart ESLint: 'eslint.restart' with args: '[]'

**⚠️ WARNING:**
- Can cause irreversible changes
- Commands like 'reloadWindow', 'reloadExtensionHost' will interrupt conversation
- Use with extreme caution`;

export function registerExecuteCommand(server: McpServer) {
  server.registerTool("execute_command", {
    title: "⚠️ Execute VSCode Command",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "⚠️ Execute VSCode Command",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, command, args, saveAllEditors }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("executeCommand", { command, args, saveAllEditors });
      
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