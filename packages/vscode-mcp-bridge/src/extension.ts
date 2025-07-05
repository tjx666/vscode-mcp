import * as vscode from 'vscode';

import { logger } from './logger';
import {        executeCommand,getCurrentWorkspacePath,
    getDefinition,
    getDiagnostics,
    getHover,
    getReferences,
    getSignatureHelp,
    health} from './services';
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
        logger.info('No workspace folder found, extension will not start socket server', true);
        return;
    }
    
    logger.info(`Current workspace: ${workspacePath}`);
    
    try {
        // Create socket server
        socketServer = new SocketServer(workspacePath);
        
        // Register all services
        socketServer.register('health', health);
        socketServer.register('getDiagnostics', getDiagnostics);
        socketServer.register('getDefinition', getDefinition);
        socketServer.register('getReferences', getReferences);
        socketServer.register('getHover', getHover);
        socketServer.register('getSignatureHelp', getSignatureHelp);
        socketServer.register('executeCommand', executeCommand);
        
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
        logger.error(`Failed to start socket server: ${error}`, true);
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