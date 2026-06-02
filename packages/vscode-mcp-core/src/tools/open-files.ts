import { createDispatcher, OpenFilesInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

const DESCRIPTION = `Open files in vscode`;

export const openFilesTool: ToolDefinition<typeof OpenFilesInputSchema> = {
  name: 'open_files',
  cliName: 'open-files',
  title: 'Open Files',
  description: DESCRIPTION,
  schema: OpenFilesInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  cli: {
    // The IPC `files` field is an array of `{ filePath, showEditor }` objects,
    // which doesn't map cleanly onto flat CLI flags. Expose simple flags and
    // assemble the array in `transform`.
    options: [
      {
        flags: '--files <paths...>',
        description: 'One or more file paths to open',
      },
      {
        flags: '--no-show-editor',
        description: 'Open files in background without showing them in the editor',
      },
    ],
    transform: (cliArgs) => {
      const paths = (cliArgs.files as string[] | undefined) ?? [];
      // commander turns `--no-show-editor` into `showEditor: false`; absence ⇒ true (IPC default).
      const showEditor = cliArgs.showEditor !== false;
      return {
        files: paths.map((filePath) => ({ filePath, showEditor })),
      };
    },
  },
  async handler(params, { workspacePath }) {
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('openFiles', { files: params.files });

    if (result.results.length === 0) {
      return '📄 No files provided to open.';
    }

    const successful = result.results.filter((r) => r.success);
    const failed = result.results.filter((r) => !r.success);

    const output = result.results
      .map((fileResult) => {
        if (fileResult.success) {
          return `✅ ${fileResult.filePath}\n   ${fileResult.message}`;
        }
        return `❌ ${fileResult.filePath}\n   ${fileResult.message}`;
      })
      .join('\n\n');

    return `📁 Opened ${successful.length}/${result.results.length} files successfully${
      failed.length > 0 ? ` (${failed.length} failed)` : ''
    }:\n\n${output}`;
  },
};
