import * as vscode from 'vscode';

/**
 * Get usage code around a specific range in a document
 * @param uri - Document URI  
 * @param range - Target range
 * @param lineRange - Number of lines to include before and after (0 = only target line, -1 = no code)
 * @returns Usage code string or undefined if unable to read
 */
export async function getUsageCode(uri: vscode.Uri, range: vscode.Range, lineRange: number = 5): Promise<string | undefined> {
    try {
        const document = await vscode.workspace.openTextDocument(uri);
        
        if (lineRange === -1) {
            // No usage code requested
            return undefined;
        }
        
        if (lineRange === 0) {
            // Only return the reference line
            return document.lineAt(range.start.line).text;
        }
        
        // Calculate start and end lines with boundaries
        const startLine = Math.max(0, range.start.line - lineRange);
        const endLine = Math.min(document.lineCount - 1, range.start.line + lineRange);
        
        // Get the range of lines
        const lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(document.lineAt(i).text);
        }
        
        return lines.join('\n');
    } catch {
        // If we can't read the file, return undefined (no usage code)
        return undefined;
    }
}