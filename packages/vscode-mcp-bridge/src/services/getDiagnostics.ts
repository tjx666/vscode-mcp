import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Handle get diagnostics
 */
export const getDiagnostics = async (
    payload: EventParams<'getDiagnostics'>
): Promise<EventResult<'getDiagnostics'>> => {
    const uri = vscode.Uri.parse(payload.uri);
    const diagnostics = vscode.languages.getDiagnostics(uri);
    
    return {
        diagnostics: diagnostics.map(diag => ({
            range: {
                start: { line: diag.range.start.line, character: diag.range.start.character },
                end: { line: diag.range.end.line, character: diag.range.end.character }
            },
            message: diag.message,
            severity: diag.severity as 1 | 2 | 3 | 4,
            source: diag.source,
            code: typeof diag.code === 'object' ? diag.code.value : diag.code
        }))
    };
}; 