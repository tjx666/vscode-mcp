import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { resolveSymbolPosition } from './resolve-symbol-position.js';
import { ensureFileIsOpen } from './utils.js';

/**
 * Get hover information for a single position
 */
async function getHoverForPosition(
    uri: string,
    symbol: string,
    codeSnippet: string | undefined,
    includeAllHovers: boolean = false
): Promise<{ position: { uri: string; symbol: string; codeSnippet?: string }; hovers: any[]; error?: string }> {
    try {
        // Ensure file is open to get accurate hover information
        await ensureFileIsOpen(uri);
        
        const vscodeUri = vscode.Uri.parse(uri);
        
        // Resolve symbol to position
        const position = await resolveSymbolPosition(vscodeUri, symbol, codeSnippet);
        
        // Execute hover provider
        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            vscodeUri,
            position
        );
        
        if (!hovers || hovers.length === 0) {
            return {
                position: { uri, symbol, codeSnippet },
                hovers: []
            };
        }
        
        // Process hovers based on includeAllHovers option
        const processedHovers = (includeAllHovers ? hovers : [hovers[0]]).map(hover => ({
            contents: hover.contents.map(content => {
                if (typeof content === 'string') {
                    return content;
                } else if (content instanceof vscode.MarkdownString) {
                    return content.value;
                } else {
                    return content.toString();
                }
            }),
            range: hover.range ? {
                start: { line: hover.range.start.line, character: hover.range.start.character },
                end: { line: hover.range.end.line, character: hover.range.end.character }
            } : undefined
        }));
        
        return {
            position: { uri, symbol, codeSnippet },
            hovers: processedHovers
        };
    } catch (error) {
        return {
            position: { uri, symbol, codeSnippet },
            hovers: [],
            error: `Failed to get hover for symbol "${symbol}" in ${uri}: ${error}`
        };
    }
}

/**
 * Handle get hover for multiple positions
 */
export const getHover = async (
    payload: EventParams<'getHover'>
): Promise<EventResult<'getHover'>> => {
    const { positions, includeAllHovers = false } = payload;
    
    // Process all positions in parallel
    const results = await Promise.all(
        positions.map(pos => 
            getHoverForPosition(pos.uri, pos.symbol, pos.codeSnippet, includeAllHovers)
        )
    );
    
    return { results };
}; 