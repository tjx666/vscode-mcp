import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, ExecuteCommandInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { VscodeMcpToolName } from "../constants.js";
import { formatToolCallError } from "../utils/format-tool-call-error.js";
import { workspacePathInputSchema } from "../utils/workspace-schema.js";

const inputSchema = {
  ...workspacePathInputSchema,
  ...ExecuteCommandInputSchema.shape
};

const DESCRIPTION = `Execute VSCode commands with arguments
**Common Use Cases:**
- Format code: 'editor.action.formatDocument' with args: '[]'
- Open files: 'vscode.open' with args: '["file:///absolute/path/to/file.ts"]'
- Save all files: 'workbench.action.files.saveAll' with args: '[]'
- Auto-fix issues: 'editor.action.fixAll' with args: '[]'
- Restart TypeScript: 'typescript.restartTsServer' with args: '[]'
- Restart ESLint: 'eslint.restart' with args: '[]'

**Important Notes:**
- Commands and arguments may change with VSCode updates, it's recommended to search in the VSCode official repository to confirm the command and arguments are correct before use
- Commands like 'reloadWindow', 'reloadExtensionHost' will interrupt conversation
- ⚠️ WARNING: May cause irreversible changes, use with caution
`;

export function registerExecuteCommand(server: McpServer) {
  server.registerTool(VscodeMcpToolName.EXECUTE_COMMAND, {
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
      const dispatcher = await createDispatcher(workspace_path);
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