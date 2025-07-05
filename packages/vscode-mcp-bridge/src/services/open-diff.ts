import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Create a temporary document with the given content
 */
async function createTempDocument(content: string, language?: string, _label?: string): Promise<vscode.Uri> {
  // Create an untitled document
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: language || 'plaintext',
  });
  
  return doc.uri;
}

/**
 * Open diff editor to compare two files or text content
 */
export const openDiff = async (
  payload: EventParams<'openDiff'>,
): Promise<EventResult<'openDiff'>> => {
  try {
    const { before, after, beforeText, afterText, beforeLabel, afterLabel, language } = payload;

    let beforeUri: vscode.Uri;
    let afterUri: vscode.Uri;
    let title: string;

    // Handle before content
    if (before) {
      beforeUri = vscode.Uri.parse(before);
    } else if (beforeText !== undefined) {
      beforeUri = await createTempDocument(beforeText, language, beforeLabel);
    } else {
      throw new Error('No before content provided');
    }

    // Handle after content
    if (after) {
      afterUri = vscode.Uri.parse(after);
    } else if (afterText !== undefined) {
      afterUri = await createTempDocument(afterText, language, afterLabel);
    } else {
      throw new Error('No after content provided');
    }

    // Create diff editor title
    if (beforeLabel && afterLabel) {
      title = `${beforeLabel} ↔ ${afterLabel}`;
    } else if (beforeLabel) {
      const afterBasename = afterUri.path.split('/').pop() || 'After';
      title = `${beforeLabel} ↔ ${afterBasename}`;
    } else if (afterLabel) {
      const beforeBasename = beforeUri.path.split('/').pop() || 'Before';
      title = `${beforeBasename} ↔ ${afterLabel}`;
    } else {
      const beforeBasename = beforeUri.path.split('/').pop() || 'Before';
      const afterBasename = afterUri.path.split('/').pop() || 'After';
      title = `${beforeBasename} ↔ ${afterBasename}`;
    }

    // Open diff editor
    await vscode.commands.executeCommand(
      'vscode.diff',
      beforeUri,
      afterUri,
      title,
    );

    return {
      success: true,
      message: `Diff editor opened successfully: ${title}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to open diff editor: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}; 