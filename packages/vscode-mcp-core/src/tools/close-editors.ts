import { createDispatcher, CloseEditorsInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

const DESCRIPTION = `Close one or more open editor tabs by file path.

Closes the tab(s) for each given absolute path across all tab groups. There is
no built-in VSCode command that closes a *specific* file by path, so this is the
counterpart to open_files (open/focus) and list_open_editors (enumerate).

**Safety:** by default, tabs with unsaved changes are NOT closed — they are
returned in \`skipped_dirty\`. Set \`forceCloseDirty: true\` only when you
intend to discard those unsaved changes.

Pair with list_open_editors to discover what's open first.`;

export const closeEditorsTool: ToolDefinition<typeof CloseEditorsInputSchema> = {
  name: 'close_editors',
  cliName: 'close-editors',
  title: 'Close Editors',
  description: DESCRIPTION,
  schema: CloseEditorsInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  cli: {
    // `paths` is a string array; expose it as a variadic flag plus a boolean.
    options: [
      {
        flags: '--paths <paths...>',
        description: 'One or more absolute file paths whose tabs should be closed',
      },
      {
        flags: '--force-close-dirty',
        description: 'Also close tabs with unsaved changes (discards them)',
      },
    ],
    transform: (cliArgs) => ({
      paths: (cliArgs.paths as string[]) ?? [],
      forceCloseDirty: cliArgs.forceCloseDirty === true,
    }),
  },
  async handler(params, { workspacePath }) {
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('closeEditors', {
      paths: params.paths,
      forceCloseDirty: params.forceCloseDirty,
    });

    const lines: string[] = [];
    if (result.closed.length > 0) {
      lines.push(`✅ Closed ${result.closed.length}: ${result.closed.join(', ')}`);
    }
    if (result.skipped_dirty.length > 0) {
      lines.push(
        `⚠️ Skipped (unsaved — not closed): ${result.skipped_dirty.join(', ')}`,
      );
    }
    if (result.not_found.length > 0) {
      lines.push(`🔍 Not open (no matching tab): ${result.not_found.join(', ')}`);
    }
    return lines.length > 0 ? lines.join('\n') : 'No matching open editors to close.';
  },
};
