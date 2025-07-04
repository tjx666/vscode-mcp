import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Handle get references
 */
export const getReferences = async (
    payload: EventParams<'getReferences'>
): Promise<EventResult<'getReferences'>> => {
    const uri = vscode.Uri.parse(payload.uri);
    const position = new vscode.Position(payload.line, payload.character);
    
    // Execute references provider
    const references = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeReferenceProvider',
        uri,
        position
    );
    
    if (!references || references.length === 0) {
        return { locations: [] };
    }
    
    return {
        locations: references.map(ref => ({
            uri: ref.uri.toString(),
            range: {
                start: { line: ref.range.start.line, character: ref.range.start.character },
                end: { line: ref.range.end.line, character: ref.range.end.character }
            }
        }))
    };
}; 