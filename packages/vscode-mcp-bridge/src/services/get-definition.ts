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
    
    // Execute definition provider - can return Location or LocationLink
    const definitions = await vscode.commands.executeCommand<Array<vscode.Location | vscode.LocationLink>>(
        'vscode.executeDefinitionProvider',
        uri,
        position
    );
    
    if (!definitions || definitions.length === 0) {
        return { locations: [] };
    }
    
    return {
        locations: definitions.map(def => {
            const isLocationLink = 'targetUri' in def;
            const uri = isLocationLink ? def.targetUri : def.uri;
            const range = isLocationLink ? def.targetRange : def.range;
            
            return {
                uri: uri.toString(),
                range: {
                    start: { line: range.start.line, character: range.start.character },
                    end: { line: range.end.line, character: range.end.character }
                }
            };
        })
    };
}; 