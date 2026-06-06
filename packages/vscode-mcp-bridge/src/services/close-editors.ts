import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Resolve the on-disk path a tab points at, for tab kinds that have one.
 * Mirrors the kind handling in list-open-editors; diff tabs match on their
 * modified side.
 */
function tabFsPath(input: unknown): string | undefined {
  if (input instanceof vscode.TabInputText) {
    return input.uri.fsPath;
  }
  if (input instanceof vscode.TabInputTextDiff) {
    return input.modified.fsPath;
  }
  if (input instanceof vscode.TabInputNotebook) {
    return input.uri.fsPath;
  }
  if (input instanceof vscode.TabInputNotebookDiff) {
    return input.modified.fsPath;
  }
  if (input instanceof vscode.TabInputCustom) {
    return input.uri.fsPath;
  }
  return undefined;
}

/**
 * Close the editor tabs for the given file paths.
 */
export const closeEditors = async (
  payload: EventParams<'closeEditors'>,
): Promise<EventResult<'closeEditors'>> => {
  const { paths, forceCloseDirty } = payload;

  const allTabs = vscode.window.tabGroups.all.flatMap((group) => group.tabs);

  const closed: string[] = [];
  const skippedDirty: string[] = [];
  const notFound: string[] = [];
  const tabsToClose: vscode.Tab[] = [];

  for (const requested of paths) {
    const matching = allTabs.filter((tab) => tabFsPath(tab.input) === requested);
    if (matching.length === 0) {
      notFound.push(requested);
      continue;
    }
    const closeable = forceCloseDirty ? matching : matching.filter((tab) => !tab.isDirty);
    if (closeable.length > 0) {
      tabsToClose.push(...closeable);
      closed.push(requested);
    } else {
      // every matching tab is dirty and forceCloseDirty is false
      skippedDirty.push(requested);
    }
  }

  if (tabsToClose.length > 0) {
    await vscode.window.tabGroups.close(tabsToClose, true);
  }

  return {
    closed,
    skipped_dirty: skippedDirty,
    not_found: notFound,
    summary: {
      requested: paths.length,
      closed: closed.length,
      skipped_dirty: skippedDirty.length,
      not_found: notFound.length,
    },
  };
};
