import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { ensureFileIsOpen, resolveFilePath } from '../utils/workspace.js';

/**
 * Completion item shape for output
 */
interface CompletionItemOutput {
    label: string;
    kind?: string;
    detail?: string;
    documentation?: string;
    insertText?: string;
    sortText?: string;
    filterText?: string;
}

/**
 * Map VSCode CompletionItemKind to string
 */
const completionKindMap: Record<number, CompletionItemOutput['kind']> = {
    [vscode.CompletionItemKind.Text]: 'Text',
    [vscode.CompletionItemKind.Method]: 'Method',
    [vscode.CompletionItemKind.Function]: 'Function',
    [vscode.CompletionItemKind.Constructor]: 'Constructor',
    [vscode.CompletionItemKind.Field]: 'Field',
    [vscode.CompletionItemKind.Variable]: 'Variable',
    [vscode.CompletionItemKind.Class]: 'Class',
    [vscode.CompletionItemKind.Interface]: 'Interface',
    [vscode.CompletionItemKind.Module]: 'Module',
    [vscode.CompletionItemKind.Property]: 'Property',
    [vscode.CompletionItemKind.Unit]: 'Unit',
    [vscode.CompletionItemKind.Value]: 'Value',
    [vscode.CompletionItemKind.Enum]: 'Enum',
    [vscode.CompletionItemKind.Keyword]: 'Keyword',
    [vscode.CompletionItemKind.Snippet]: 'Snippet',
    [vscode.CompletionItemKind.Color]: 'Color',
    [vscode.CompletionItemKind.File]: 'File',
    [vscode.CompletionItemKind.Reference]: 'Reference',
    [vscode.CompletionItemKind.Folder]: 'Folder',
    [vscode.CompletionItemKind.EnumMember]: 'EnumMember',
    [vscode.CompletionItemKind.Constant]: 'Constant',
    [vscode.CompletionItemKind.Struct]: 'Struct',
    [vscode.CompletionItemKind.Event]: 'Event',
    [vscode.CompletionItemKind.Operator]: 'Operator',
    [vscode.CompletionItemKind.TypeParameter]: 'TypeParameter',
};

/**
 * Get code completions at a specific position in a file
 */
export const getCompletions = async (
    payload: EventParams<'getCompletions'>
): Promise<EventResult<'getCompletions'>> => {
    const { filePath, line, character, triggerCharacter, offset, limit } = payload;
    const maxLimit = Math.min(limit, 100);

    const uri = resolveFilePath(filePath);
    const position = new vscode.Position(line, character);

    // Ensure file is open for accurate completions
    await ensureFileIsOpen(uri.toString());

    // Execute completion provider
    const completionList = await vscode.commands.executeCommand<vscode.CompletionList | vscode.CompletionItem[]>(
        'vscode.executeCompletionItemProvider',
        uri,
        position,
        triggerCharacter
    );

    // Normalize to array
    let allItems: vscode.CompletionItem[];
    let isIncomplete = false;

    if (!completionList) {
        allItems = [];
    } else if (Array.isArray(completionList)) {
        allItems = completionList;
    } else {
        allItems = completionList.items;
        isIncomplete = completionList.isIncomplete;
    }

    const total = allItems.length;

    // Apply pagination
    const paginatedItems = allItems.slice(offset, offset + maxLimit);
    const hasMore = offset + maxLimit < total;

    // Transform to our schema
    const items: CompletionItemOutput[] = paginatedItems.map((item) => {
        const label = typeof item.label === 'string' ? item.label : item.label.label;
        const detail = typeof item.label === 'object' ? item.label.detail : item.detail;

        let documentation: string | undefined;
        if (item.documentation) {
            if (typeof item.documentation === 'string') {
                documentation = item.documentation;
            } else {
                documentation = item.documentation.value;
            }
        }

        let insertText: string | undefined;
        if (item.insertText) {
            if (typeof item.insertText === 'string') {
                insertText = item.insertText;
            } else {
                insertText = item.insertText.value;
            }
        }

        return {
            label,
            kind: item.kind !== undefined ? completionKindMap[item.kind] : undefined,
            detail,
            documentation,
            insertText,
            sortText: item.sortText,
            filterText: item.filterText,
        };
    });

    return {
        items,
        total,
        offset,
        limit: maxLimit,
        hasMore,
        isIncomplete,
    };
};
