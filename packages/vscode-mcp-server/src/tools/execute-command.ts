import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, ExecuteCommandInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...ExecuteCommandInputSchema.shape
};

const DESCRIPTION = `⚠️ Execute VSCode commands with arguments - DANGEROUS tool that can modify workspace, settings, or trigger harmful operations.

**Common Use Cases:**
- Format code: 'editor.action.formatDocument'
- Open files: 'vscode.open' with file URI
- Save all files: 'workbench.action.files.saveAll' 
- Auto-fix issues: 'editor.action.fixAll'
- Restart TypeScript: 'typescript.restartTsServer'
- Restart ESLint: 'eslint.restart'

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