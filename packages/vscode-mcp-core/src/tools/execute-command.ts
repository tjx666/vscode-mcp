import { createDispatcher, ExecuteCommandInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

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

export const executeCommandTool: ToolDefinition<typeof ExecuteCommandInputSchema> = {
  name: 'execute_command',
  cliName: 'execute-command',
  title: '⚠️ Execute VSCode Command',
  description: DESCRIPTION,
  schema: ExecuteCommandInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
  async handler(params, { workspacePath }) {
    const { command, args, saveAllEditors } = params;
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('executeCommand', { command, args, saveAllEditors });
    return JSON.stringify(result, null, 2);
  },
};
