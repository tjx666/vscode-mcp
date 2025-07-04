import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';

import { getCurrentWorkspacePath } from './utils';

/**
 * Handle health check
 */
export const health = async (
    _payload: EventParams<'health'>
): Promise<EventResult<'health'>> => {
    const workspacePath = getCurrentWorkspacePath();
    
    return {
        status: 'ok',
        version: '1.0.0',
        workspace: workspacePath || 'No workspace'
    };
}; 