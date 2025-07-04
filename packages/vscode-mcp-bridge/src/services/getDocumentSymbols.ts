import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Handle get document symbols
 */
export const getDocumentSymbols = async (
    payload: EventParams<'getDocumentSymbols'>
): Promise<EventResult<'getDocumentSymbols'>> => {
    const uri = vscode.Uri.parse(payload.uri);
    
    // Execute document symbol provider
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        uri
    );
    
    if (!symbols || symbols.length === 0) {
        return { symbols: [] };
    }
    
    /**
     * Recursive function to convert symbols
     */
    const convertSymbol = (symbol: vscode.DocumentSymbol): any => ({
        name: symbol.name,
        detail: symbol.detail,
        kind: symbol.kind,
        range: {
            start: { line: symbol.range.start.line, character: symbol.range.start.character },
            end: { line: symbol.range.end.line, character: symbol.range.end.character }
        },
        selectionRange: {
            start: { line: symbol.selectionRange.start.line, character: symbol.selectionRange.start.character },
            end: { line: symbol.selectionRange.end.line, character: symbol.selectionRange.end.character }
        },
        children: symbol.children ? symbol.children.map(convertSymbol) : []
    });
    
    return {
        symbols: symbols.map(convertSymbol)
    };
}; 