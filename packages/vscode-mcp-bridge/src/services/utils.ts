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