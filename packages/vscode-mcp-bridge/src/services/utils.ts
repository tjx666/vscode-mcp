import * as vscode from 'vscode';

/**
 * Get current workspace path
 */
export function getCurrentWorkspacePath(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }
    
    // Use the first workspace folder
    return workspaceFolders[0].uri.fsPath;
} 