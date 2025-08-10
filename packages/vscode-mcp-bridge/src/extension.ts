import { 
    CallAgentInputSchema,
    CallAgentOutputSchema,
    ExecuteCommandInputSchema, 
    ExecuteCommandOutputSchema,
    GetCommandsInputSchema,
    GetCommandsOutputSchema,
    GetDiagnosticsInputSchema,
    GetDiagnosticsOutputSchema,
    GetReferencesInputSchema,
    GetReferencesOutputSchema,
    GetSymbolLSPInfoInputSchema,
    GetSymbolLSPInfoOutputSchema,
    HealthCheckInputSchema,
    HealthCheckOutputSchema,
    HighlightCodeInputSchema,
    HighlightCodeOutputSchema,
    ListWorkspacesInputSchema,
    ListWorkspacesOutputSchema,
    OpenDiffInputSchema,
    OpenDiffOutputSchema,
    OpenFilesInputSchema,
    OpenFilesOutputSchema,
    RenameSymbolInputSchema,
    RenameSymbolOutputSchema,
} from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import type {CopyOpenedFilesPathOptions} from './commands/copy-opened-files-path';
import { copyOpenedFilesPathCommand  } from './commands/copy-opened-files-path';
import { sleepCommand } from './commands/sleep';
import { logger } from './logger';
import {
    callAgent,
    executeCommand,
    getCommands,
getCurrentWorkspacePath,
    getDiagnostics,
    getReferences,
    getSymbolLSPInfo,
    health,
    highlightCode,
    listWorkspaces,
    openDiff,
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
        
        socketServer.register('highlightCode', {
            handler: highlightCode,
            payloadSchema: HighlightCodeInputSchema,
            resultSchema: HighlightCodeOutputSchema
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
        
        socketServer.register('getCommands', {
            handler: getCommands,
            payloadSchema: GetCommandsInputSchema,
            resultSchema: GetCommandsOutputSchema
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
        
        socketServer.register('openDiff', {
            handler: openDiff,
            payloadSchema: OpenDiffInputSchema,
            resultSchema: OpenDiffOutputSchema
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