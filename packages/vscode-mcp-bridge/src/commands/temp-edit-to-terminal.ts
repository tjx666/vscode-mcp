import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as vscode from 'vscode';

/**
 * Map to track temporary files and their associated disposables
 */
const tempFileMap = new Map<string, vscode.Disposable>();

const INITIAL_CONTENT = '';

/**
 * Temp edit to terminal command implementation
 * Opens a temporary markdown file for editing, sends content to active terminal when closed
 */
export async function tempEditToTerminalCommand(): Promise<void> {
    try {
        // Generate unique temporary directory and file
        const uuid = crypto.randomUUID();
        const tempDir = path.join(os.tmpdir(), uuid);
        const tempFilePath = path.join(tempDir, 'prompt-editor.md');
        
        // Create temporary directory
        await fs.mkdir(tempDir, { recursive: true });
        
        // Create temporary file
        await fs.writeFile(tempFilePath, INITIAL_CONTENT, 'utf8');
        
        // Open the document
        const document = await vscode.workspace.openTextDocument(tempFilePath);
        const editor = await vscode.window.showTextDocument(document);
        
        // Position cursor at the beginning
        const position = new vscode.Position(0, 0);
        editor.selection = new vscode.Selection(position, position);
        
        // Register document close listener
        const disposable = vscode.workspace.onDidCloseTextDocument(async ({ uri }) => {
            if (uri.fsPath === tempFilePath) {
                await handleDocumentClose(tempFilePath, uuid);
            }
        });
        
        // Store the disposable for cleanup
        tempFileMap.set(uuid, disposable);
        
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create temporary editor: ${error}`);
    }
}

/**
 * Handle document close event
 */
async function handleDocumentClose(filePath: string, uuid: string): Promise<void> {
    try {
        // Read file content
        let content = '';
        try {
            content = await fs.readFile(filePath, 'utf8');
            
            // Clean up temporary directory and file
            await fs.rm(path.dirname(filePath), { recursive: true, force: true });
        } catch {
            // File/directory might not exist or be accessible
        }
        
        // Clean up disposable
        const disposable = tempFileMap.get(uuid);
        if (disposable) {
            disposable.dispose();
            tempFileMap.delete(uuid);
        }
        
        // Send to terminal if content is not empty
        if (content.trim()) {
            await sendToActiveTerminal(content);
        }
        
    } catch (error) {
        vscode.window.showErrorMessage(`Error processing temporary file: ${error}`);
    }
}


/**
 * Send content to active terminal
 */
async function sendToActiveTerminal(content: string): Promise<void> {
    const activeTerminal = vscode.window.activeTerminal;
    
    if (!activeTerminal) {
        const selection = await vscode.window.showWarningMessage(
            'No active terminal found. Please open a terminal first.',
            'Open Terminal'
        );
        if (selection === 'Open Terminal') {
            await vscode.commands.executeCommand('workbench.action.terminal.new');
        }
        return;
    }
    
    try {
        // Show terminal and send content
        activeTerminal.show();
        activeTerminal.sendText(content, false); // false = don't add newline
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to send content to terminal: ${error}`);
    }
}

/**
 * Cleanup function to dispose all temp file listeners
 * Should be called when extension is deactivated
 */
export function cleanupTempEditToTerminal(): void {
    tempFileMap.forEach((disposable) => {
        disposable.dispose();
    });
    tempFileMap.clear();
}