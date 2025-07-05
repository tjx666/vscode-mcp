import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Get hover information for a single position
 */
async function getHoverForPosition(
    uri: string,
    line: number,
    character: number,
    includeAllHovers: boolean = false
): Promise<{ position: { uri: string; line: number; character: number }; hovers: any[]; error?: string }> {
    try {
        const vscodeUri = vscode.Uri.parse(uri);
        const position = new vscode.Position(line, character);
        
        // Execute hover provider
        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            vscodeUri,
            position
        );
        
        if (!hovers || hovers.length === 0) {
            return {
                position: { uri, line, character },
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
            position: { uri, line, character },
            hovers: processedHovers
        };
    } catch (error) {
        return {
            position: { uri, line, character },
            hovers: [],
            error: `Failed to get hover for ${uri}:${line}:${character}: ${error}`
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
            getHoverForPosition(pos.uri, pos.line, pos.character, includeAllHovers)
        )
    );
    
    return { results };
}; 