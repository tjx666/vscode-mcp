import { exec } from 'child_process';
import { promisify } from 'util';

import * as vscode from 'vscode';

import { logger } from '../logger.js';

const execAsync = promisify(exec);

export interface FileSafetyResult {
  safe: boolean;
  error?: string;
}

/**
 * Check if a file is safe to operate on (rename/remove)
 * Safety criteria:
 * 1. File must be within workspace boundaries
 * 2. File must be tracked by git (committed or staged)
 */
export async function checkFileSafety(uri: vscode.Uri): Promise<FileSafetyResult> {
  // 1. Check workspace boundaries
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    return {
      safe: false,
      error: 'File is outside workspace boundaries - only workspace files can be modified for safety',
    };
  }

  // 2. Check git tracking status
  const gitResult = await checkGitTracking(uri, workspaceFolder);
  if (!gitResult.safe) {
    return gitResult;
  }

  return { safe: true };
}

/**
 * Check if file is tracked by git (committed or at least staged)
 */
async function checkGitTracking(uri: vscode.Uri, workspaceFolder: vscode.WorkspaceFolder): Promise<FileSafetyResult> {
  try {
    const relativePath = vscode.workspace.asRelativePath(uri, false);
    const workspacePath = workspaceFolder.uri.fsPath;

    // Check if file is tracked by git (either committed or staged)
    const { stdout: lsFilesOutput } = await execAsync(
      `git ls-files --cached "${relativePath}"`,
      { cwd: workspacePath }
    );

    if (lsFilesOutput.trim()) {
      // File is tracked (committed or staged)
      return { safe: true };
    }

    // Check if file is at least staged (added but not committed)
    const { stdout: statusOutput } = await execAsync(
      `git status --porcelain "${relativePath}"`,
      { cwd: workspacePath }
    );

    const statusLine = statusOutput.trim();
    if (statusLine) {
      const indexStatus = statusLine[0]; // First character indicates index status
      if (indexStatus === 'A' || indexStatus === 'M' || indexStatus === 'R' || indexStatus === 'C') {
        // File is staged (added, modified, renamed, or copied in index)
        return { safe: true };
      }
    }

    // File is not tracked by git
    return {
      safe: false,
      error: 'File is not tracked by git - only git-tracked files can be modified for safety. Please add the file to git first.',
    };

  } catch (error) {
    logger.info(`Git check failed for ${uri.fsPath}: ${error}`);
    
    // If git is not available or not a git repository, be more permissive
    // but only for files within workspace
    return {
      safe: false,
      error: 'Unable to verify git tracking status - this might not be a git repository. For safety, only git-tracked files can be modified.',
    };
  }
}