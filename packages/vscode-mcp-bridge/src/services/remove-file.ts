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

    // Configure deletion options - VSCode always moves files to trash
    const deleteOptions: { recursive?: boolean } = {};
    if (payload.recursive !== undefined) {
      deleteOptions.recursive = payload.recursive;
    }
    
    // Delete file/folder using workspace.fs.delete (always moves to trash)
    await vscode.workspace.fs.delete(uri, deleteOptions);
    
    const message = `Successfully removed ${payload.filePath} (moved to trash - can be restored from system trash)`;
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