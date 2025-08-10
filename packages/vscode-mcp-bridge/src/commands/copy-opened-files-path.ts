import * as path from 'path';

import * as vscode from 'vscode';

/**
 * Options for copyOpenedFilesPath command
 */
export interface CopyOpenedFilesPathOptions {
    isSendToActiveTerminal?: boolean;
}

/**
 * Copy opened files path command implementation
 */
export async function copyOpenedFilesPathCommand(options: CopyOpenedFilesPathOptions = {}): Promise<void> {
    const { isSendToActiveTerminal = false } = options;
    
    // Get workspace root path
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspaceRoot = workspaceFolder?.uri.fsPath;
    
    // Get all opened text documents and process paths
    const openedFiles = vscode.workspace.textDocuments
        .filter(({ uri }) => uri.scheme === 'file') // Only file URIs, exclude untitled etc.
        .map(({ uri }) => {
            const filePath = uri.fsPath;
            
            // If no workspace or file is outside workspace, use absolute path
            if (!workspaceRoot) {
                return filePath;
            }
            
            const relativePath = path.relative(workspaceRoot, filePath);
            
            // If relative path starts with '..', file is outside workspace, use absolute path
            return relativePath.startsWith('..') ? filePath : relativePath;
        })
        .sort(); // Sort paths alphabetically
    
    if (openedFiles.length === 0) {
        return;
    }
    
    // Format paths as text (one per line)
    const pathsText = openedFiles.join('\n');
    
    if (isSendToActiveTerminal) {
        // Send to active terminal
        const activeTerminal = vscode.window.activeTerminal;
        if (activeTerminal) {
            activeTerminal.sendText(pathsText);
        }
    } else {
        // Copy to clipboard
        await vscode.env.clipboard.writeText(pathsText);
    }
}