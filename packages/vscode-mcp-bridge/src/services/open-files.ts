import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Handle opening multiple files
 */
export const openFiles = async (
    payload: EventParams<'openFiles'>
): Promise<EventResult<'openFiles'>> => {
    const results = await Promise.all(
        payload.files.map(async (fileRequest) => {
            try {
                const uri = vscode.Uri.parse(fileRequest.uri);
                
                // Always open the document to load it
                const document = await vscode.workspace.openTextDocument(uri);
                
                // Conditionally show in editor based on showEditor parameter
                const showEditor = fileRequest.showEditor ?? true; // Default to true
                if (showEditor) {
                    await vscode.window.showTextDocument(document, {
                        preview: false, // Don't use preview mode
                        preserveFocus: false // Give focus to the opened file
                    });
                }
                
                return {
                    uri: fileRequest.uri,
                    success: true,
                    message: showEditor 
                        ? 'File opened and displayed in editor'
                        : 'File opened in background'
                };
            } catch (error) {
                return {
                    uri: fileRequest.uri,
                    success: false,
                    message: `Failed to open file: ${String(error)}`
                };
            }
        })
    );

    return { results };
}; 