import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

const toSymbolList = (symbols: vscode.SymbolInformation[] | undefined) =>
    (symbols ?? []).map(s => ({
        name: s.name,
        kind: s.kind,
        containerName: s.containerName || undefined,
        uri: s.location.uri.toString(),
        range: {
            start: { line: s.location.range.start.line, character: s.location.range.start.character },
            end: { line: s.location.range.end.line, character: s.location.range.end.character },
        },
    }));

export const searchWorkspaceSymbols = async (
    payload: EventParams<'searchWorkspaceSymbols'>
): Promise<EventResult<'searchWorkspaceSymbols'>> => {
    const results = await Promise.all(
        payload.queries.map(async query => {
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                query
            );
            return { query, symbols: toSymbolList(symbols) };
        })
    );

    return { results };
};
