import * as path from 'path';

import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { logger } from '../logger.js';

export const renameFile = async (
  payload: EventParams<'renameFile'>,
): Promise<EventResult<'renameFile'>> => {
  logger.info(`Renaming file ${payload.filePath} to "${payload.newName}"`);

  try {
    // 1. Resolve file path to URI
    let oldUri: vscode.Uri;
    if (path.isAbsolute(payload.filePath)) {
      // Absolute path
      oldUri = vscode.Uri.file(payload.filePath);
    } else {
      // Relative path - resolve relative to workspace root
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return {
          success: false,
          newUri: payload.filePath,
          error: 'No workspace folder found for relative path resolution',
        };
      }
      const absolutePath = path.join(workspaceFolder.uri.fsPath, payload.filePath);
      oldUri = vscode.Uri.file(absolutePath);
    }
    
    // 2. Validate the file exists
    try {
      await vscode.workspace.fs.stat(oldUri);
    } catch {
      return {
        success: false,
        newUri: payload.filePath,
        error: `File does not exist: ${payload.filePath}`,
      };
    }

    // 3. Validate new name
    const newName = payload.newName.trim();
    if (!newName) {
      return {
        success: false,
        newUri: payload.filePath,
        error: 'New name cannot be empty',
      };
    }

    // 4. Create new URI by replacing the file name
    const oldPath = oldUri.fsPath;
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    const newUri = vscode.Uri.file(newPath);

    // 5. Check if the new file path already exists
    try {
      await vscode.workspace.fs.stat(newUri);
      return {
        success: false,
        newUri: payload.filePath,
        error: `Target file already exists: ${newPath}`,
      };
    } catch {
      // File doesn't exist, which is good for renaming
    }

    // 6. Execute rename using WorkspaceEdit to trigger automatic import updates
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.renameFile(oldUri, newUri);
    
    const success = await vscode.workspace.applyEdit(workspaceEdit);

    if (!success) {
      return {
        success: false,
        newUri: payload.filePath,
        error: 'Failed to apply rename operation',
      };
    }

    logger.info(`File renamed successfully: ${payload.filePath} -> ${newUri.toString()}`);

    return {
      success: true,
      newUri: newUri.toString(),
    };
  } catch (error) {
    logger.error(`Rename file failed: ${error}`);
    return {
      success: false,
      newUri: payload.filePath,
      error: `Rename failed: ${error}`,
    };
  }
};