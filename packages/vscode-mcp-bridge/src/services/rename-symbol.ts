import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { logger } from '../logger.js';

export const renameSymbol = async (
  payload: EventParams<'renameSymbol'>,
): Promise<EventResult<'renameSymbol'>> => {
  logger.info(`Renaming symbol at ${payload.uri}:${payload.line}:${payload.character} to "${payload.newName}"`);

  try {
    // 1. Parse URI and validate
    const uri = vscode.Uri.parse(payload.uri);
    const position = new vscode.Position(payload.line, payload.character);

    // 2. Validate the document exists and position is valid
    const document = await vscode.workspace.openTextDocument(uri);
    
    if (position.line >= document.lineCount) {
      return {
        success: false,
        modifiedFiles: [],
        totalChanges: 0,
        error: `Line ${payload.line} is out of range (document has ${document.lineCount} lines)`,
      };
    }

    const line = document.lineAt(position.line);
    if (position.character >= line.text.length) {
      return {
        success: false,
        modifiedFiles: [],
        totalChanges: 0,
        error: `Character ${payload.character} is out of range (line has ${line.text.length} characters)`,
      };
    }

    // 3. Validate new name
    if (!payload.newName.trim()) {
      return {
        success: false,
        modifiedFiles: [],
        totalChanges: 0,
        error: 'New name cannot be empty',
      };
    }

    // 4. Execute rename using VSCode command
    const workspaceEdit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
      'vscode.executeDocumentRenameProvider',
      uri,
      position,
      payload.newName
    );

    if (!workspaceEdit) {
      return {
        success: false,
        modifiedFiles: [],
        totalChanges: 0,
        error: 'Position is not renameable (no symbol found)',
      };
    }

    // 5. Apply the workspace edit
    const success = await vscode.workspace.applyEdit(workspaceEdit);

    if (!success) {
      return {
        success: false,
        modifiedFiles: [],
        totalChanges: 0,
        error: 'Failed to apply rename edits',
      };
    }

    // 6. Collect statistics about the changes
    const modifiedFiles: Array<{ uri: string; changeCount: number }> = [];
    let totalChanges = 0;
    let symbolName = 'unknown';

    // Extract original symbol name from the first edit if available
    const entries = workspaceEdit.entries();
    if (entries.length > 0) {
      const [firstUri, firstEdits] = entries[0];
      if (firstEdits.length > 0) {
        const firstEdit = firstEdits[0];
        // Try to get the original text from the first edit
        try {
          const editDoc = await vscode.workspace.openTextDocument(firstUri);
          symbolName = editDoc.getText(firstEdit.range);
        } catch {
          // If we can't get the original text, keep 'unknown'
        }
      }
    }

    // Process all entries to collect statistics
    for (const [fileUri, textEdits] of entries) {
      modifiedFiles.push({
        uri: fileUri.toString(),
        changeCount: textEdits.length,
      });
      totalChanges += textEdits.length;
    }

    logger.info(`Rename completed successfully: "${symbolName}" -> "${payload.newName}", ${modifiedFiles.length} files, ${totalChanges} changes`);

    return {
      success: true,
      symbolName,
      modifiedFiles,
      totalChanges,
    };
  } catch (error) {
    logger.error(`Rename symbol failed: ${error}`);
    return {
      success: false,
      modifiedFiles: [],
      totalChanges: 0,
      error: `Rename failed: ${error}`,
    };
  }
}; 