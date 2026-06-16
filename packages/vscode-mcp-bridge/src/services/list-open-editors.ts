import type { EventParams, EventResult, OpenEditorTab } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Classify a tab's input and pull out its resource URI when it has one.
 *
 * Enumerates ALL tab input kinds (not just file-scheme `TabInputText`) so the
 * result includes diffs, notebooks, custom editors, untitled buffers,
 * interactive windows, webviews and terminals — anything the user actually has
 * open. Untitled buffers arrive as `TabInputText` with an `untitled:` scheme,
 * so they are covered by the text branch.
 */
function describeTabInput(input: unknown): { kind: OpenEditorTab['kind']; uri?: string } {
  if (input instanceof vscode.TabInputText) {
    return { kind: 'text', uri: input.uri.toString() };
  }
  if (input instanceof vscode.TabInputTextDiff) {
    return { kind: 'diff', uri: input.modified.toString() };
  }
  if (input instanceof vscode.TabInputNotebook) {
    return { kind: 'notebook', uri: input.uri.toString() };
  }
  if (input instanceof vscode.TabInputNotebookDiff) {
    return { kind: 'notebook-diff', uri: input.modified.toString() };
  }
  if (input instanceof vscode.TabInputCustom) {
    return { kind: 'custom', uri: input.uri.toString() };
  }
  if (input instanceof vscode.TabInputWebview) {
    return { kind: 'webview' };
  }
  if (input instanceof vscode.TabInputTerminal) {
    return { kind: 'terminal' };
  }
  return { kind: 'other' };
}

/**
 * List every open editor tab across all tab groups in this window.
 */
export const listOpenEditors = async (
  _payload: EventParams<'listOpenEditors'>,
): Promise<EventResult<'listOpenEditors'>> => {
  const groups = vscode.window.tabGroups.all;
  const editors: OpenEditorTab[] = [];

  groups.forEach((group, groupIndex) => {
    for (const tab of group.tabs) {
      const { kind, uri } = describeTabInput(tab.input);
      editors.push({
        label: tab.label,
        uri,
        kind,
        group_index: groupIndex,
        is_active: tab.isActive,
        is_dirty: tab.isDirty,
        is_pinned: tab.isPinned,
        is_preview: tab.isPreview,
      });
    }
  });

  const activeGroupIndex = groups.findIndex((group) => group.isActive);

  return {
    editors,
    summary: {
      total: editors.length,
      groups: groups.length,
      active_group_index: activeGroupIndex >= 0 ? activeGroupIndex : undefined,
    },
  };
};
