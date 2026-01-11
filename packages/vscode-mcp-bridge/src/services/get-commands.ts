import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Get all available VSCode commands with pagination
 */
export const getCommands = async (
    payload: EventParams<'getCommands'>
): Promise<EventResult<'getCommands'>> => {
    const { filterInternal, pattern, offset, limit } = payload;
    const maxLimit = Math.min(limit, 500);

    // Get all commands
    let allCommands = await vscode.commands.getCommands(filterInternal);

    // Apply pattern filter if provided
    if (pattern) {
        const regex = new RegExp(pattern, 'i');
        allCommands = allCommands.filter((cmd: string) => regex.test(cmd));
    }

    // Sort alphabetically
    allCommands.sort();

    const total = allCommands.length;
    const paginatedCommands = allCommands.slice(offset, offset + maxLimit);
    const hasMore = offset + maxLimit < total;

    return {
        commands: paginatedCommands,
        total,
        offset,
        limit: maxLimit,
        hasMore,
    };
};
