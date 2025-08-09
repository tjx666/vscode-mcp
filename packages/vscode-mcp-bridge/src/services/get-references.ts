import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { resolveSymbolPosition } from './resolve-symbol-position.js';
import { ensureFileIsOpen } from './utils.js';

/**
 * Handle get references
 */
export const getReferences = async (
    payload: EventParams<'getReferences'>
): Promise<EventResult<'getReferences'>> => {
    // Ensure file is open to get accurate references
    await ensureFileIsOpen(payload.uri);
    
    const uri = vscode.Uri.parse(payload.uri);
    
    // Resolve symbol to position
    const position = await resolveSymbolPosition(uri, payload.symbol, payload.codeSnippet);
    
    // Execute references provider
    const references = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeReferenceProvider',
        uri,
        position,
        { includeDeclaration: payload.includeDeclaration ?? false }
    );
    
    if (!references || references.length === 0) {
        return { locations: [] };
    }
    
    const locations = await Promise.all(
        references.map(async (ref) => {
            const location: any = {
                uri: ref.uri.toString(),
                range: {
                    start: { line: ref.range.start.line, character: ref.range.start.character },
                    end: { line: ref.range.end.line, character: ref.range.end.character }
                }
            };

            // Add usage code if requested
            if (payload.usageCodeLineRange !== -1) {
                const usageCode = await getUsageCode(ref.uri, ref.range, payload.usageCodeLineRange ?? 5);
                if (usageCode) {
                    location.usageCode = usageCode;
                }
            }

            return location;
        })
    );

    return { locations };
};

/**
 * Get usage code around a reference location
 */
async function getUsageCode(uri: vscode.Uri, range: vscode.Range, lineRange: number): Promise<string | undefined> {
    try {
        const document = await vscode.workspace.openTextDocument(uri);
        
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