import * as os from 'os';

import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import packageJson from '../../package.json';
import { detectIdeType } from './call-agent/ide-detection';
import { getCurrentWorkspacePath } from './utils';

/**
 * Handle health check
 */
export const health = async (
    _payload: EventParams<'health'>
): Promise<EventResult<'health'>> => {
    try {
        const workspacePath = getCurrentWorkspacePath();
        const ideType = await detectIdeType();
        
        return {
            status: 'ok',
            extension_version: packageJson.version,
            workspace: workspacePath || undefined,
            timestamp: new Date().toISOString(),
            system_info: {
                platform: os.platform(),
                node_version: process.version,
                vscode_version: vscode.version,
                ide_type: ideType
            }
        };
    } catch (error) {
        return {
            status: 'error',
            extension_version: packageJson.version,
            timestamp: new Date().toISOString(),
            error: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
            system_info: {
                platform: os.platform(),
                node_version: process.version,
                vscode_version: vscode.version,
                ide_type: 'unknown'
            }
        };
    }
}; 