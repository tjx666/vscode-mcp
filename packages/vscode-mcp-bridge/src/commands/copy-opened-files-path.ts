import * as path from 'path';

import * as vscode from 'vscode';

/**
 * Options for copyOpenedFilesPath command
 */
export interface CopyOpenedFilesPathOptions {
    isSendToActiveTerminal?: boolean;
    includeAtSymbol?: boolean;
    addQuotes?: boolean;
    focusTerminal?: boolean;
}

/**
 * Copy opened files path command implementation
 */
export async function copyOpenedFilesPathCommand(options: CopyOpenedFilesPathOptions = {}): Promise<void> {
    const { isSendToActiveTerminal = false, includeAtSymbol = false, addQuotes = true, focusTerminal = false } = options;
    
    // Get workspace root path
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspaceRoot = workspaceFolder?.uri.fsPath;
    
    // Get all visible tabs from all tab groups
    const visibleFiles: string[] = [];
    
    for (const tabGroup of vscode.window.tabGroups.all) {
        for (const tab of tabGroup.tabs) {
            if (tab.input instanceof vscode.TabInputText) {
                const uri = tab.input.uri;
                if (uri.scheme === 'file') {
                    const filePath = uri.fsPath;
                    
                    // If no workspace or file is outside workspace, use absolute path
                    if (!workspaceRoot) {
                        visibleFiles.push(filePath);
                    } else {
                        const relativePath = path.relative(workspaceRoot, filePath);
                        
                        // If relative path starts with '..', file is outside workspace, use absolute path
                        visibleFiles.push(relativePath.startsWith('..') ? filePath : relativePath);
                    }
                }
            }
        }
    }
    
    const openedFiles = [...new Set(visibleFiles)].sort(); // Remove duplicates and sort
    
    if (openedFiles.length === 0) {
        return;
    }
    
    // Format paths as text (one per line)
    const pathsText = openedFiles.map(file => {
        const formattedPath = includeAtSymbol ? `@${file}` : file;
        return addQuotes ? `'${formattedPath}'` : formattedPath;
    }).join('\n');
    
    if (isSendToActiveTerminal) {
        // Send to active terminal
        const activeTerminal = vscode.window.activeTerminal;
        if (activeTerminal) {
            activeTerminal.sendText(pathsText);
            if (focusTerminal) {
                activeTerminal.show();
            }
        }
    } else {
        // Copy to clipboard
        await vscode.env.clipboard.writeText(pathsText);
    }
}