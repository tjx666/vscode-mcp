import type { EventParams, EventResult, WorkspaceInfo } from '@vscode-mcp/vscode-mcp-ipc';
import { ListWorkspacesInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import packageJson from '../../package.json';
import { detectIdeType } from './call-agent/ide-detection';

/**
 * Get workspace type
 */
function getWorkspaceType(): 'single-folder' | 'multi-folder' | 'workspace-file' | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return undefined;
    }
    
    if (workspaceFolders.length === 1) {
        // Check if it's a .code-workspace file
        if (vscode.workspace.workspaceFile) {
            return 'workspace-file';
        }
        return 'single-folder';
    }
    
    return 'multi-folder';
}

/**
 * Get workspace name
 */
function getWorkspaceName(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return undefined;
    }
    
    // For workspace file, use the workspace file name
    if (vscode.workspace.workspaceFile) {
        const path = vscode.workspace.workspaceFile.path;
        const segments = path.split('/');
        const fileName = segments.at(-1);
        return fileName?.replace('.code-workspace', '');
    }
    
    // For single folder, use folder name
    if (workspaceFolders.length === 1) {
        return workspaceFolders[0].name;
    }
    
    // For multi-folder, join folder names
    return workspaceFolders.map(f => f.name).join(', ');
}

/**
 * Get all workspace folders
 */
function getWorkspaceFolders(): string[] | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return undefined;
    }
    
    return workspaceFolders.map(f => f.uri.fsPath);
}

/**
 * Handle list workspaces request
 */
export const listWorkspaces = async (
    payload: EventParams<'listWorkspaces'>
): Promise<EventResult<'listWorkspaces'>> => {
    try {
        // Parse payload with defaults from schema
        ListWorkspacesInputSchema.parse(payload);
        
        // For the VSCode extension, we can only return the current workspace
        const currentWorkspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        if (!currentWorkspacePath) {
            // No workspace is open
            return {
                workspaces: [],
                summary: {
                    total: 0,
                    active: 0,
                    available: 0,
                    cleaned: 0
                }
            };
        }
        
        // Get IDE type
        const ideType = await detectIdeType();
        
        // Create workspace info for the current workspace
        const currentWorkspace: WorkspaceInfo = {
            workspace_path: currentWorkspacePath,
            workspace_name: getWorkspaceName(),
            workspace_type: getWorkspaceType(),
            folders: getWorkspaceFolders(),
            status: 'active',
            extension_version: packageJson.version,
            vscode_version: vscode.version,
            ide_type: ideType,
            // Additional info is not available in extension context without importing server logic
        };
        
        return {
            workspaces: [currentWorkspace],
            summary: {
                total: 1,
                active: 1,
                available: 0,
                cleaned: 0
            }
        };
    } catch (error) {
        throw new Error(`Failed to list workspaces: ${error instanceof Error ? error.message : String(error)}`);
    }
};