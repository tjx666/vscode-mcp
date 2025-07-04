import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Handle get hover
 */
export const getHover = async (
    payload: EventParams<'getHover'>
): Promise<EventResult<'getHover'>> => {
    const uri = vscode.Uri.parse(payload.uri);
    const position = new vscode.Position(payload.line, payload.character);
    
    // Execute hover provider
    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        uri,
        position
    );
    
    if (!hovers || hovers.length === 0) {
        return { hover: null };
    }
    
    const hover = hovers[0]; // Take the first hover
    
    return {
        hover: {
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
        }
    };
}; 