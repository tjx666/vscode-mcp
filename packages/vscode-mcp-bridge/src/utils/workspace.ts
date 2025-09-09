import * as path from 'path';

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

/**
 * Open a file to ensure it's loaded and LSP has processed it
 */
export async function ensureFileIsOpen(uriString: string): Promise<void> {
    try {
        const uri = vscode.Uri.parse(uriString);
        const document = await vscode.workspace.openTextDocument(uri);
        
        // We don't need to show the document in the editor, just ensure it's loaded
        // This will trigger LSP processing and populate accurate language features
        await document.save(); // This is just to ensure the document is fully processed
    } catch (error) {
        // If we can't open the file, we'll still try to get language features
        // This might happen with files that are not in the workspace
        console.warn(`Could not open file ${uriString}: ${error}`);
    }
}

/**
 * Resolve a file path to VSCode URI
 * Supports both absolute paths and relative paths (relative to workspace root)
 */
export function resolveFilePath(filePath: string): vscode.Uri {
    if (path.isAbsolute(filePath)) {
        // Absolute path - convert directly to URI
        return vscode.Uri.file(filePath);
    } else {
        // Relative path - resolve relative to workspace root
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found for relative path resolution');
        }
        const absolutePath = path.join(workspaceFolder.uri.fsPath, filePath);
        return vscode.Uri.file(absolutePath);
    }
}

/**
 * Convert an array of file paths to VSCode URIs
 */
export function resolveFilePaths(filePaths: string[]): vscode.Uri[] {
    return filePaths.map(filePath => resolveFilePath(filePath));
} 