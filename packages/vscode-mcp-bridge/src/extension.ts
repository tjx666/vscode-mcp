import { 
    ExecuteCommandInputSchema, 
    ExecuteCommandOutputSchema,
    GetCommandsInputSchema,
    GetCommandsOutputSchema,
    GetDefinitionInputSchema,
    GetDefinitionOutputSchema,
    GetDiagnosticsInputSchema,
    GetDiagnosticsOutputSchema,
    GetHoverInputSchema,
    GetHoverOutputSchema,
    GetReferencesInputSchema,
    GetReferencesOutputSchema,
    GetSignatureHelpInputSchema,
    GetSignatureHelpOutputSchema,
    HealthCheckInputSchema,
    HealthCheckOutputSchema,
    HighlightCodeInputSchema,
    HighlightCodeOutputSchema,
    OpenDiffInputSchema,
    OpenDiffOutputSchema,
    OpenFilesInputSchema,
    OpenFilesOutputSchema,
    RenameSymbolInputSchema,
    RenameSymbolOutputSchema,
    RequestInputInputSchema,
    RequestInputOutputSchema} from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { logger } from './logger';
import {        executeCommand,    getCommands,
getCurrentWorkspacePath,
    getDefinition,
    getDiagnostics,
    getHover,
    getReferences,
    getSignatureHelp,
    health,
    highlightCode,    openDiff,
    openFiles,
    renameSymbol,
    requestInput} from './services';
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
        
        socketServer.register('getCommands', {
            handler: getCommands,
            payloadSchema: GetCommandsInputSchema,
            resultSchema: GetCommandsOutputSchema
        });
        
        socketServer.register('getDefinition', {
            handler: getDefinition,
            payloadSchema: GetDefinitionInputSchema,
            resultSchema: GetDefinitionOutputSchema
        });
        
        socketServer.register('getReferences', {
            handler: getReferences,
            payloadSchema: GetReferencesInputSchema,
            resultSchema: GetReferencesOutputSchema
        });
        
        socketServer.register('getHover', {
            handler: getHover,
            payloadSchema: GetHoverInputSchema,
            resultSchema: GetHoverOutputSchema
        });
        
        socketServer.register('getSignatureHelp', {
            handler: getSignatureHelp,
            payloadSchema: GetSignatureHelpInputSchema,
            resultSchema: GetSignatureHelpOutputSchema
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
        
        socketServer.register('requestInput', {
            handler: requestInput,
            payloadSchema: RequestInputInputSchema,
            resultSchema: RequestInputOutputSchema
        });
        
        socketServer.register('renameSymbol', {
            handler: renameSymbol,
            payloadSchema: RenameSymbolInputSchema,
            resultSchema: RenameSymbolOutputSchema
        });
        
        // Start socket server
        await socketServer.start();
        
        logger.info(`Socket server started successfully at: ${socketServer.getSocketPath()}`);
        logger.info(`Registered ${socketServer.getServicesCount()} services`);
        
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