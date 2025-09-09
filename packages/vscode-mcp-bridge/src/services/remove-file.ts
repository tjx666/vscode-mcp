import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { logger } from '../logger.js';
import { checkFileSafety } from '../utils/file-safety-check.js';
import { resolveFilePath } from '../utils/workspace.js';

export const removeFile = async (
  payload: EventParams<'removeFile'>,
): Promise<EventResult<'removeFile'>> => {
  logger.info(`Removing file/folder "${payload.filePath}" (recursive: ${payload.recursive})`);

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

    // Execute delete using WorkspaceEdit for better integration
    const workspaceEdit = new vscode.WorkspaceEdit();
    
    // Configure deletion options
    const deleteOptions: { recursive?: boolean; ignoreIfNotExists?: boolean } = {
      ignoreIfNotExists: true,
    };
    if (payload.recursive !== undefined) {
      deleteOptions.recursive = payload.recursive;
    }
    
    workspaceEdit.deleteFile(uri, deleteOptions);
    const success = await vscode.workspace.applyEdit(workspaceEdit);

    if (!success) {
      return {
        success: false,
        error: 'Failed to apply delete operation',
      };
    }
    
    // Save all dirty editors after delete operation
    await vscode.workspace.saveAll(false);

    const message = `Successfully removed ${payload.filePath} using WorkspaceEdit (moved to trash - may support undo)`;
    logger.info(message);
    
    return {
      success: true,
      deletedPath: payload.filePath,
      message,
    };
  } catch (error) {
    const errorMsg = `Error removing file/folder: ${String(error)}`;
    logger.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
};