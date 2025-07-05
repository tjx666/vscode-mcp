import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { ensureFileIsOpen } from './utils.js';

/**
 * Handle get definition
 */
export const getDefinition = async (
    payload: EventParams<'getDefinition'>
): Promise<EventResult<'getDefinition'>> => {
    // Ensure file is open to get accurate definitions
    await ensureFileIsOpen(payload.uri);
    
    const uri = vscode.Uri.parse(payload.uri);
    const position = new vscode.Position(payload.line, payload.character);
    
    // Execute definition provider
    const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeDefinitionProvider',
        uri,
        position
    );
    
    if (!definitions || definitions.length === 0) {
        return { locations: [] };
    }
    
    return {
        locations: definitions.map(def => ({
            uri: def.uri.toString(),
            range: {
                start: { line: def.range.start.line, character: def.range.start.character },
                end: { line: def.range.end.line, character: def.range.end.character }
            }
        }))
    };
}; 