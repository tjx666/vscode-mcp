import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { logger } from '../logger.js';
import { checkFileSafety } from './file-safety-check.js';
import { resolveFilePath } from './utils.js';

export const removeFile = async (
  payload: EventParams<'removeFile'>,
): Promise<EventResult<'removeFile'>> => {
  logger.info(`Removing file/folder "${payload.filePath}" (useTrash: ${payload.useTrash}, recursive: ${payload.recursive})`);

  try {
    // Resolve file path to URI
    const uri = resolveFilePath(payload.filePath);
    
    // Check if file/folder exists
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      logger.info(`Target exists: ${stat.type === vscode.FileType.Directory ? 'folder' : 'file'}`);
    } catch (error) {
      return {
        success: false,
        error: `File or folder not found: ${payload.filePath} - ${String(error)}`,
      };
    }

    // Safety check: ensure file is within workspace and git-tracked
    const safetyCheck = await checkFileSafety(uri);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: `Safety check failed: ${safetyCheck.error}`,
      };
    }

    // Create workspace edit for deletion
    const workspaceEdit = new vscode.WorkspaceEdit();
    
    // Configure deletion options
    const deleteOptions: { recursive?: boolean; useTrash?: boolean } = {};
    if (payload.recursive !== undefined) {
      deleteOptions.recursive = payload.recursive;
    }
    if (payload.useTrash !== undefined) {
      deleteOptions.useTrash = payload.useTrash;
    }
    
    // Add delete operation to workspace edit
    workspaceEdit.deleteFile(uri, deleteOptions);
    
    // Apply the workspace edit
    const success = await vscode.workspace.applyEdit(workspaceEdit);
    
    if (success) {
      const trashMsg = payload.useTrash !== false ? ' (moved to trash)' : ' (permanently deleted)';
      const message = `Successfully removed ${payload.filePath}${trashMsg}`;
      logger.info(message);
      
      return {
        success: true,
        deletedPath: payload.filePath,
        message,
      };
    } else {
      const errorMsg = 'Failed to apply workspace edit for file deletion';
      logger.error(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  } catch (error) {
    const errorMsg = `Error removing file/folder: ${String(error)}`;
    logger.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
};