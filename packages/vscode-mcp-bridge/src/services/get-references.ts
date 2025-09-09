import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { getUsageCode } from '../utils/get-usage-code.js';
import { resolveSymbolPosition } from '../utils/resolve-symbol-position.js';
import { ensureFileIsOpen, resolveFilePath } from '../utils/workspace.js';

/**
 * Handle get references
 */
export const getReferences = async (
    payload: EventParams<'getReferences'>
): Promise<EventResult<'getReferences'>> => {
    // Resolve file path to URI
    const uri = resolveFilePath(payload.filePath);
    
    // Ensure file is open to get accurate references
    await ensureFileIsOpen(uri.toString());
    
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

 