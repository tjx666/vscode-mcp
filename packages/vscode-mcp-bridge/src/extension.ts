import { 
    CallAgentInputSchema,
    CallAgentOutputSchema,
    ExecuteCommandInputSchema, 
    ExecuteCommandOutputSchema,
    GetDiagnosticsInputSchema,
    GetDiagnosticsOutputSchema,
    GetReferencesInputSchema,
    GetReferencesOutputSchema,
    GetSymbolLSPInfoInputSchema,
    GetSymbolLSPInfoOutputSchema,
    HealthCheckInputSchema,
    HealthCheckOutputSchema,
    ListWorkspacesInputSchema,
    ListWorkspacesOutputSchema,
    OpenFilesInputSchema,
    OpenFilesOutputSchema,
    RenameSymbolInputSchema,
    RenameSymbolOutputSchema,
} from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import type {CopyCurrentSelectionReferenceOptions} from './commands/copy-current-selection-reference';
import { copyCurrentSelectionReferenceCommand } from './commands/copy-current-selection-reference';
import type {CopyOpenedFilesPathOptions} from './commands/copy-opened-files-path';
import { copyOpenedFilesPathCommand  } from './commands/copy-opened-files-path';
import { sleepCommand } from './commands/sleep';
import { logger } from './logger';
import {
    callAgent,
    executeCommand,
getCurrentWorkspacePath,
    getDiagnostics,
    getReferences,
    getSymbolLSPInfo,
    health,
    listWorkspaces,
    openFiles,
    renameSymbol,
} from './services';
import { SocketServer } from './socket-server';

// Global socket server instance
let socketServer: SocketServer | null = null;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
    logger.info('VSCode MCP Bridge extension is being activated');
    
    // Get current workspace path
    const workspacePath = getCurrentWorkspacePath();
    if (!workspacePath) {
        logger.info('No workspace folder found, extension will not start socket server');
        return;
    }
    
    logger.info(`Current workspace: ${workspacePath}`);
    
    try {
        // Create socket server
        socketServer = new SocketServer(workspacePath);
        
        // Register all services with schema validation
        socketServer.register('callAgent', {
            handler: callAgent,
            payloadSchema: CallAgentInputSchema,
            resultSchema: CallAgentOutputSchema
        });
        
        socketServer.register('health', {
            handler: health,
            payloadSchema: HealthCheckInputSchema,
            resultSchema: HealthCheckOutputSchema
        });
        
        
        socketServer.register('getDiagnostics', {
            handler: getDiagnostics,
            payloadSchema: GetDiagnosticsInputSchema,
            resultSchema: GetDiagnosticsOutputSchema
        });
        
        socketServer.register('getSymbolLSPInfo', {
            handler: getSymbolLSPInfo,
            payloadSchema: GetSymbolLSPInfoInputSchema,
            resultSchema: GetSymbolLSPInfoOutputSchema
        });
        
        
        socketServer.register('getReferences', {
            handler: getReferences,
            payloadSchema: GetReferencesInputSchema,
            resultSchema: GetReferencesOutputSchema
        });
        
        socketServer.register('executeCommand', {
            handler: executeCommand,
            payloadSchema: ExecuteCommandInputSchema,
            resultSchema: ExecuteCommandOutputSchema
        });
        
        
        socketServer.register('openFiles', {
            handler: openFiles,
            payloadSchema: OpenFilesInputSchema,
            resultSchema: OpenFilesOutputSchema
        });
        
        
        
        socketServer.register('renameSymbol', {
            handler: renameSymbol,
            payloadSchema: RenameSymbolInputSchema,
            resultSchema: RenameSymbolOutputSchema
        });
        
        socketServer.register('listWorkspaces', {
            handler: listWorkspaces,
            payloadSchema: ListWorkspacesInputSchema,
            resultSchema: ListWorkspacesOutputSchema
        });
        
        // Start socket server
        await socketServer.start();
        
        logger.info(`Socket server started successfully at: ${socketServer.getSocketPath()}`);
        logger.info(`Registered ${socketServer.getServicesCount()} services`);
        
        // Register VSCode commands
        const sleepCommandDisposable = vscode.commands.registerCommand('vscode-mcp-bridge.sleep', async (duration: number) => {
            await sleepCommand(duration);
        });
        context.subscriptions.push(sleepCommandDisposable);

        const copyOpenedFilesPathDisposable = vscode.commands.registerCommand('vscode-mcp-bridge.copyOpenedFilesPath', async (options?: CopyOpenedFilesPathOptions) => {
            await copyOpenedFilesPathCommand(options);
        });
        context.subscriptions.push(copyOpenedFilesPathDisposable);

        const copyCurrentSelectionReferenceDisposable = vscode.commands.registerCommand('vscode-mcp-bridge.copyCurrentSelectionReference', async (options?: CopyCurrentSelectionReferenceOptions) => {
            await copyCurrentSelectionReferenceCommand(options);
        });
        context.subscriptions.push(copyCurrentSelectionReferenceDisposable);

        // Register cleanup on extension deactivation
        context.subscriptions.push({
            dispose: () => {
                if (socketServer) {
                    socketServer.cleanup();
                    socketServer = null;
                }
            }
        });
        
    } catch (error) {
        logger.error(`Failed to start socket server: ${error}`);
        vscode.window.showErrorMessage(`VSCode MCP Bridge: Failed to start socket server - ${error}`);
    }
}

/**
 * Extension deactivation
 */
export function deactivate() {
    logger.info('VSCode MCP Bridge extension is being deactivated');
    
    if (socketServer) {
        socketServer.cleanup();
        socketServer = null;
    }

    logger.dispose();
} 