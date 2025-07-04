// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import * as vscode from 'vscode';

// Type definitions
interface Request {
    id: string;
    method: string;
    params?: any;
}

interface Response {
    id: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        details?: string;
    };
}

interface LSPParams {
    uri: string;
    line?: number;
    character?: number;
    query?: string;
}

// Global variables for socket server management
let socketServer: net.Server | null = null;
let socketPath: string | null = null;

/**
 * Generate Unix socket path based on workspace path
 */
function getSocketPath(workspacePath: string): string {
    const hash = crypto.createHash('md5').update(workspacePath).digest('hex').slice(0, 8);
    return path.join(os.tmpdir(), `vscode-mcp-${hash}.sock`);
}

/**
 * Get current workspace path
 */
function getCurrentWorkspacePath(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }
    
    // Use the first workspace folder
    return workspaceFolders[0].uri.fsPath;
}

/**
 * Log message with timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [VSCode MCP Bridge] ${message}`;
    
    switch (level) {
        case 'info':
            console.log(logMessage);
            break;
        case 'warn':
            console.warn(logMessage);
            break;
        case 'error':
            console.error(logMessage);
            break;
    }
}

/**
 * Validate URI format
 */
function validateUri(uri: string): boolean {
    try {
        const parsed = vscode.Uri.parse(uri);
        return parsed.scheme === 'file' && parsed.fsPath.length > 0;
    } catch {
        return false;
    }
}

/**
 * Create error response
 */
function createErrorResponse(id: string, code: number, message: string, details?: string): Response {
    return {
        id,
        error: {
            code,
            message,
            details
        }
    };
}

/**
 * Create success response
 */
function createSuccessResponse(id: string, result: any): Response {
    return {
        id,
        result
    };
}

/**
 * Handle health check
 */
async function handleHealth(id: string, _params: any): Promise<Response> {
    const workspacePath = getCurrentWorkspacePath();
    const result = {
        status: 'ok',
        version: '1.0.0',
        workspace: workspacePath || 'No workspace'
    };
    
    return createSuccessResponse(id, result);
}

/**
 * Handle get diagnostics
 */
async function handleGetDiagnostics(id: string, params: LSPParams): Promise<Response> {
    try {
        if (!params.uri) {
            return createErrorResponse(id, 400, 'Missing required parameter: uri');
        }
        
        if (!validateUri(params.uri)) {
            return createErrorResponse(id, 400, 'Invalid URI format');
        }
        
        const uri = vscode.Uri.parse(params.uri);
        const diagnostics = vscode.languages.getDiagnostics(uri);
        
        const result = {
            diagnostics: diagnostics.map(diag => ({
                range: {
                    start: { line: diag.range.start.line, character: diag.range.start.character },
                    end: { line: diag.range.end.line, character: diag.range.end.character }
                },
                message: diag.message,
                severity: diag.severity,
                source: diag.source,
                code: diag.code
            }))
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get diagnostics', String(error));
    }
}

/**
 * Handle get workspace info
 */
async function handleGetWorkspaceInfo(id: string, _params: any): Promise<Response> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspaceInfo = {
            folders: workspaceFolders?.map(folder => ({
                uri: folder.uri.toString(),
                name: folder.name,
                index: folder.index
            })) || [],
            name: vscode.workspace.name || 'Untitled'
        };
        
        return createSuccessResponse(id, workspaceInfo);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get workspace info', String(error));
    }
}

/**
 * Handle get definition
 */
async function handleGetDefinition(id: string, params: LSPParams): Promise<Response> {
    try {
        if (!params.uri) {
            return createErrorResponse(id, 400, 'Missing required parameter: uri');
        }
        
        if (params.line === undefined || params.character === undefined) {
            return createErrorResponse(id, 400, 'Missing required parameters: line and character');
        }
        
        if (!validateUri(params.uri)) {
            return createErrorResponse(id, 400, 'Invalid URI format');
        }
        
        if (params.line < 0 || params.character < 0) {
            return createErrorResponse(id, 400, 'Invalid position: line and character must be non-negative');
        }
        
        const uri = vscode.Uri.parse(params.uri);
        const position = new vscode.Position(params.line, params.character);
        
        // Execute definition provider
        const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            uri,
            position
        );
        
        if (!definitions || definitions.length === 0) {
            return createSuccessResponse(id, { definitions: [] });
        }
        
        const result = {
            definitions: definitions.map(def => ({
                uri: def.uri.toString(),
                range: {
                    start: { line: def.range.start.line, character: def.range.start.character },
                    end: { line: def.range.end.line, character: def.range.end.character }
                }
            }))
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get definition', String(error));
    }
}

/**
 * Handle get references
 */
async function handleGetReferences(id: string, params: LSPParams): Promise<Response> {
    try {
        if (!params.uri) {
            return createErrorResponse(id, 400, 'Missing required parameter: uri');
        }
        
        if (params.line === undefined || params.character === undefined) {
            return createErrorResponse(id, 400, 'Missing required parameters: line and character');
        }
        
        if (!validateUri(params.uri)) {
            return createErrorResponse(id, 400, 'Invalid URI format');
        }
        
        if (params.line < 0 || params.character < 0) {
            return createErrorResponse(id, 400, 'Invalid position: line and character must be non-negative');
        }
        
        const uri = vscode.Uri.parse(params.uri);
        const position = new vscode.Position(params.line, params.character);
        
        // Execute references provider
        const references = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeReferenceProvider',
            uri,
            position
        );
        
        if (!references || references.length === 0) {
            return createSuccessResponse(id, { references: [] });
        }
        
        const result = {
            references: references.map(ref => ({
                uri: ref.uri.toString(),
                range: {
                    start: { line: ref.range.start.line, character: ref.range.start.character },
                    end: { line: ref.range.end.line, character: ref.range.end.character }
                }
            }))
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get references', String(error));
    }
}

/**
 * Handle get hover
 */
async function handleGetHover(id: string, params: LSPParams): Promise<Response> {
    try {
        if (!params.uri) {
            return createErrorResponse(id, 400, 'Missing required parameter: uri');
        }
        
        if (params.line === undefined || params.character === undefined) {
            return createErrorResponse(id, 400, 'Missing required parameters: line and character');
        }
        
        if (!validateUri(params.uri)) {
            return createErrorResponse(id, 400, 'Invalid URI format');
        }
        
        if (params.line < 0 || params.character < 0) {
            return createErrorResponse(id, 400, 'Invalid position: line and character must be non-negative');
        }
        
        const uri = vscode.Uri.parse(params.uri);
        const position = new vscode.Position(params.line, params.character);
        
        // Execute hover provider
        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            position
        );
        
        if (!hovers || hovers.length === 0) {
            return createSuccessResponse(id, { hover: null });
        }
        
        const hover = hovers[0]; // Take the first hover
        const result = {
            hover: {
                contents: hover.contents.map(content => {
                    if (typeof content === 'string') {
                        return { kind: 'plaintext', value: content };
                    } else if (content instanceof vscode.MarkdownString) {
                        return { kind: 'markdown', value: content.value };
                    } else {
                        return { kind: 'plaintext', value: content.toString() };
                    }
                }),
                range: hover.range ? {
                    start: { line: hover.range.start.line, character: hover.range.start.character },
                    end: { line: hover.range.end.line, character: hover.range.end.character }
                } : undefined
            }
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get hover', String(error));
    }
}

/**
 * Handle get completions
 */
async function handleGetCompletions(id: string, params: LSPParams): Promise<Response> {
    try {
        if (!params.uri) {
            return createErrorResponse(id, 400, 'Missing required parameter: uri');
        }
        
        if (params.line === undefined || params.character === undefined) {
            return createErrorResponse(id, 400, 'Missing required parameters: line and character');
        }
        
        if (!validateUri(params.uri)) {
            return createErrorResponse(id, 400, 'Invalid URI format');
        }
        
        if (params.line < 0 || params.character < 0) {
            return createErrorResponse(id, 400, 'Invalid position: line and character must be non-negative');
        }
        
        const uri = vscode.Uri.parse(params.uri);
        const position = new vscode.Position(params.line, params.character);
        
        // Execute completion provider
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            uri,
            position
        );
        
        if (!completions || completions.items.length === 0) {
            return createSuccessResponse(id, { completions: [] });
        }
        
        const result = {
            completions: completions.items.map(item => ({
                label: item.label,
                kind: item.kind,
                detail: item.detail,
                documentation: item.documentation,
                insertText: item.insertText,
                range: item.range ? (() => {
                    if ('start' in item.range && 'end' in item.range) {
                        // Simple Range
                        return {
                            start: { line: item.range.start.line, character: item.range.start.character },
                            end: { line: item.range.end.line, character: item.range.end.character }
                        };
                    } else if ('inserting' in item.range && 'replacing' in item.range) {
                        // CompletionItemInsertReplaceRange
                        return {
                            inserting: {
                                start: { line: item.range.inserting.start.line, character: item.range.inserting.start.character },
                                end: { line: item.range.inserting.end.line, character: item.range.inserting.end.character }
                            },
                            replacing: {
                                start: { line: item.range.replacing.start.line, character: item.range.replacing.start.character },
                                end: { line: item.range.replacing.end.line, character: item.range.replacing.end.character }
                            }
                        };
                    }
                    return;
                })() : undefined
            }))
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get completions', String(error));
    }
}

/**
 * Handle get signature help
 */
async function handleGetSignatureHelp(id: string, params: LSPParams): Promise<Response> {
    try {
        if (!params.uri) {
            return createErrorResponse(id, 400, 'Missing required parameter: uri');
        }
        
        if (params.line === undefined || params.character === undefined) {
            return createErrorResponse(id, 400, 'Missing required parameters: line and character');
        }
        
        if (!validateUri(params.uri)) {
            return createErrorResponse(id, 400, 'Invalid URI format');
        }
        
        if (params.line < 0 || params.character < 0) {
            return createErrorResponse(id, 400, 'Invalid position: line and character must be non-negative');
        }
        
        const uri = vscode.Uri.parse(params.uri);
        const position = new vscode.Position(params.line, params.character);
        
        // Execute signature help provider
        const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
            'vscode.executeSignatureHelpProvider',
            uri,
            position
        );
        
        if (!signatureHelp || signatureHelp.signatures.length === 0) {
            return createSuccessResponse(id, { signatureHelp: null });
        }
        
        const result = {
            signatureHelp: {
                signatures: signatureHelp.signatures.map(sig => ({
                    label: sig.label,
                    documentation: sig.documentation,
                    parameters: sig.parameters?.map(param => ({
                        label: param.label,
                        documentation: param.documentation
                    })) || []
                })),
                activeSignature: signatureHelp.activeSignature,
                activeParameter: signatureHelp.activeParameter
            }
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get signature help', String(error));
    }
}

/**
 * Handle get document symbols
 */
async function handleGetDocumentSymbols(id: string, params: LSPParams): Promise<Response> {
    try {
        if (!params.uri) {
            return createErrorResponse(id, 400, 'Missing required parameter: uri');
        }
        
        if (!validateUri(params.uri)) {
            return createErrorResponse(id, 400, 'Invalid URI format');
        }
        
        const uri = vscode.Uri.parse(params.uri);
        
        // Execute document symbol provider
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            uri
        );
        
        if (!symbols || symbols.length === 0) {
            return createSuccessResponse(id, { symbols: [] });
        }
        
        /**
         * Recursive function to convert symbols
         */
        const convertSymbol = (symbol: vscode.DocumentSymbol): any => ({
            name: symbol.name,
            detail: symbol.detail,
            kind: symbol.kind,
            range: {
                start: { line: symbol.range.start.line, character: symbol.range.start.character },
                end: { line: symbol.range.end.line, character: symbol.range.end.character }
            },
            selectionRange: {
                start: { line: symbol.selectionRange.start.line, character: symbol.selectionRange.start.character },
                end: { line: symbol.selectionRange.end.line, character: symbol.selectionRange.end.character }
            },
            children: symbol.children ? symbol.children.map(convertSymbol) : []
        });
        
        const result = {
            symbols: symbols.map(convertSymbol)
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get document symbols', String(error));
    }
}

/**
 * Handle get workspace symbols
 */
async function handleGetWorkspaceSymbols(id: string, params: LSPParams): Promise<Response> {
    try {
        const query = params.query || '';
        
        // Execute workspace symbol provider
        const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider',
            query
        );
        
        if (!symbols || symbols.length === 0) {
            return createSuccessResponse(id, { symbols: [] });
        }
        
        const result = {
            symbols: symbols.map(symbol => ({
                name: symbol.name,
                kind: symbol.kind,
                location: {
                    uri: symbol.location.uri.toString(),
                    range: {
                        start: { line: symbol.location.range.start.line, character: symbol.location.range.start.character },
                        end: { line: symbol.location.range.end.line, character: symbol.location.range.end.character }
                    }
                },
                containerName: symbol.containerName
            }))
        };
        
        return createSuccessResponse(id, result);
    } catch (error) {
        return createErrorResponse(id, 500, 'Failed to get workspace symbols', String(error));
    }
}

/**
 * Handle not implemented methods
 */
async function _handleNotImplemented(id: string, method: string): Promise<Response> {
    return createErrorResponse(id, 501, `Method not implemented: ${method}`);
}

/**
 * Route message to appropriate handler
 */
async function routeMessage(request: Request): Promise<Response> {
    const { id, method, params } = request;
    
    log(`Routing message: ${method}`);
    
    switch (method) {
        case 'health':
            return await handleHealth(id, params);
        
        case 'getDiagnostics':
            return await handleGetDiagnostics(id, params);
        
        case 'getWorkspaceInfo':
            return await handleGetWorkspaceInfo(id, params);
        
        case 'getDefinition':
            return await handleGetDefinition(id, params);
        
        case 'getReferences':
            return await handleGetReferences(id, params);
        
        case 'getHover':
            return await handleGetHover(id, params);
        
        case 'getCompletions':
            return await handleGetCompletions(id, params);
        
        case 'getSignatureHelp':
            return await handleGetSignatureHelp(id, params);
        
        case 'getDocumentSymbols':
            return await handleGetDocumentSymbols(id, params);
        
        case 'getWorkspaceSymbols':
            return await handleGetWorkspaceSymbols(id, params);
        
        default:
            return createErrorResponse(id, 404, `Unknown method: ${method}`);
    }
}

/**
 * Handle socket data
 */
async function handleSocketData(socket: net.Socket, data: any) {
    try {
        const message = JSON.parse(data.toString());
        log(`Received message: ${JSON.stringify(message)}`);
        
        // Validate request format
        if (!message.id || !message.method) {
            const response = createErrorResponse(
                message.id || 'unknown',
                400,
                'Invalid request format: missing id or method'
            );
            socket.write(JSON.stringify(response));
            return;
        }
        
        // Route message and get response
        const response = await routeMessage(message);
        
        // Send response
        socket.write(JSON.stringify(response));
        log(`Sent response: ${JSON.stringify(response)}`);
        
    } catch (error) {
        log(`Error handling socket data: ${error}`, 'error');
        
        const errorResponse = createErrorResponse(
            'unknown',
            500,
            'Internal server error',
            String(error)
        );
        
        socket.write(JSON.stringify(errorResponse));
    }
}

/**
 * Create and start Unix socket server
 */
function createSocketServer(): Promise<net.Server> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        
        server.on('connection', (socket) => {
            log(`Client connected to socket: ${socketPath}`);
            
            socket.on('data', (data) => {
                handleSocketData(socket, data);
            });
            
            socket.on('close', () => {
                log('Client disconnected');
            });
            
            socket.on('error', (error) => {
                log(`Socket error: ${error}`, 'error');
            });
        });
        
        server.on('error', (error) => {
            log(`Server error: ${error}`, 'error');
            reject(error);
        });
        
        server.listen(socketPath!, () => {
            log(`Socket server listening on: ${socketPath}`);
            resolve(server);
        });
    });
}

/**
 * Clean up socket file and server
 */
function cleanup() {
    if (socketServer) {
        socketServer.close();
        socketServer = null;
        log('Socket server closed');
    }
    
    if (socketPath && fs.existsSync(socketPath)) {
        try {
            fs.unlinkSync(socketPath);
            log(`Socket file removed: ${socketPath}`);
        } catch (error) {
            log(`Error removing socket file: ${error}`, 'error');
        }
    }
    
    socketPath = null;
}

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
    log('VSCode MCP Bridge extension is being activated');
    
    // Get current workspace path
    const workspacePath = getCurrentWorkspacePath();
    if (!workspacePath) {
        log('No workspace folder found, extension will not start socket server', 'warn');
        return;
    }
    
    log(`Current workspace: ${workspacePath}`);
    
    // Generate socket path
    socketPath = getSocketPath(workspacePath);
    log(`Generated socket path: ${socketPath}`);
    
    // Clean up existing socket file if it exists
    if (fs.existsSync(socketPath)) {
        try {
            fs.unlinkSync(socketPath);
            log('Removed existing socket file');
        } catch (error) {
            log(`Error removing existing socket file: ${error}`, 'error');
        }
    }
    
    try {
        // Create and start socket server
        socketServer = await createSocketServer();
        log('Socket server started successfully');
        
        // Register cleanup on extension deactivation
        context.subscriptions.push({
            dispose: cleanup
        });
        
    } catch (error) {
        log(`Failed to start socket server: ${error}`, 'error');
        vscode.window.showErrorMessage(`VSCode MCP Bridge: Failed to start socket server - ${error}`);
    }
}

/**
 * Extension deactivation
 */
export function deactivate() {
    log('VSCode MCP Bridge extension is being deactivation');
    cleanup();
}
