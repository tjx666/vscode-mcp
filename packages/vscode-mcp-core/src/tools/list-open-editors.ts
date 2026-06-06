import { createDispatcher, ListOpenEditorsInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

const DESCRIPTION = `List all open editor tabs in a VSCode window as structured data.

Returns every tab across all tab groups (editor columns) — not just text files,
but also diffs, notebooks, custom editors, untitled buffers, webviews and
terminals. Each entry reports its label, resource URI
(when it has one), kind, tab group index, and active/dirty/pinned/preview flags.

**When to use:**
- See which files the user already has open before opening more
- Find the active editor / dirty (unsaved) buffers
- Understand the user's current editor layout

**Note:** Pair with \`open_files\` to open or focus a file in the same window.`;

export const listOpenEditorsTool: ToolDefinition<typeof ListOpenEditorsInputSchema> = {
  name: 'list_open_editors',
  cliName: 'list-open-editors',
  title: 'List Open Editors',
  description: DESCRIPTION,
  schema: ListOpenEditorsInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  async handler(_params, { workspacePath }) {
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('listOpenEditors', {});

    if (result.editors.length === 0) {
      return '📭 No open editor tabs in this window.';
    }

    const lines = result.editors.map((editor) => {
      const flags = [
        editor.is_active ? 'active' : null,
        editor.is_dirty ? 'dirty' : null,
        editor.is_pinned ? 'pinned' : null,
        editor.is_preview ? 'preview' : null,
      ]
        .filter(Boolean)
        .join(', ');
      const location = editor.uri ?? '(no uri)';
      const suffix = flags ? ` (${flags})` : '';
      return `- [group ${editor.group_index}] ${editor.kind}: ${editor.label} — ${location}${suffix}`;
    });

    const { total, groups, active_group_index } = result.summary;
    const header =
      `📑 ${total} open editor tab(s) across ${groups} group(s)` +
      (active_group_index === undefined ? '' : ` (active group: ${active_group_index})`) +
      ':';

    return `${header}\n${lines.join('\n')}`;
  },
};
