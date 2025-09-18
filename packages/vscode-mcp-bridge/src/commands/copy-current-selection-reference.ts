import * as path from 'path';

import * as vscode from 'vscode';

/**
 * Options for copyCurrentSelectionReference command
 */
export interface CopyCurrentSelectionReferenceOptions {
    isSendToActiveTerminal?: boolean;
    includeRange?: boolean;
    includeAtSymbol?: boolean;
    addSpaces?: boolean;
    focusTerminal?: boolean;
}

/**
 * Copy current selection reference command implementation
 */
export async function copyCurrentSelectionReferenceCommand(options: CopyCurrentSelectionReferenceOptions = {}): Promise<void> {
    const {
        isSendToActiveTerminal = false,
        includeRange = true,
        includeAtSymbol = true,
        addSpaces = false,
        focusTerminal = false
    } = options;

    // Get active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    const uri = activeEditor.document.uri;
    if (uri.scheme !== 'file') {
        return;
    }

    // Get workspace root path
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspaceRoot = workspaceFolder?.uri.fsPath;

    // Get relative or absolute file path
    const filePath = uri.fsPath;
    let pathText: string;

    if (!workspaceRoot) {
        pathText = filePath;
    } else {
        const relativePath = path.relative(workspaceRoot, filePath);
        // If relative path starts with '..', file is outside workspace, use absolute path
        pathText = relativePath.startsWith('..') ? filePath : relativePath;
    }

    // Get selection range
    const selection = activeEditor.selection;
    let referenceText = pathText;

    // Add line range if includeRange is true and there's a selection or cursor position
    if (includeRange) {
        if (!selection.isEmpty) {
            // Multi-line or single-line selection
            const startLine = selection.start.line + 1; // VSCode lines are 0-based, but display as 1-based
            const endLine = selection.end.line + 1;

            if (startLine === endLine) {
                referenceText += `#L${startLine}`;
            } else {
                referenceText += `#L${startLine}-${endLine}`;
            }
        } else {
            // Just cursor position
            const currentLine = selection.active.line + 1;
            referenceText += `#L${currentLine}`;
        }
    }

    // Add @ symbol if includeAtSymbol is true
    if (includeAtSymbol) {
        referenceText = `@${referenceText}`;
    }

    // Add spaces if addSpaces is true
    if (addSpaces) {
        referenceText = ` ${referenceText} `;
    }

    if (isSendToActiveTerminal) {
        // Send to active terminal
        const activeTerminal = vscode.window.activeTerminal;
        if (activeTerminal) {
            activeTerminal.sendText(referenceText, false);
            if (focusTerminal) {
                activeTerminal.show();
            }
        }
    } else {
        // Copy to clipboard
        await vscode.env.clipboard.writeText(referenceText);
    }
}