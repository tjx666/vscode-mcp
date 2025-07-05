import * as crypto from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import type { BaseRequest, BaseResponse, EventName } from '@vscode-mcp/vscode-mcp-ipc';

import { logger } from './logger';

type ServiceFunction = (
    payload: any
) => Promise<any>;

/**
 * Socket Server for handling MCP communication
 */
export class SocketServer {
    private server: net.Server | null = null;
    private socketPath: string | null = null;
    private services: Map<string, ServiceFunction> = new Map();

    constructor(private workspacePath: string) {
        this.socketPath = this.generateSocketPath(workspacePath);
    }

    /**
     * Generate Unix socket path based on workspace path
     */
    private generateSocketPath(workspacePath: string): string {
        const hash = crypto.createHash('md5').update(workspacePath).digest('hex').slice(0, 8);
        return process.platform === 'win32'
            ? `\\\\.\\pipe\\vscode-mcp-${hash}`
            : path.join(os.tmpdir(), `vscode-mcp-${hash}.sock`);
    }

    /**
     * Register a service handler
     */
    register(method: EventName, handler: ServiceFunction): void {
        this.services.set(method, handler);
        logger.info(`Registered service: ${method}`);
    }

    /**
     * Handle incoming request and route to appropriate service
     */
    private async handleRequest(request: BaseRequest): Promise<BaseResponse> {
        const { id, method, params } = request;
        
        logger.info(`Processing request: ${method}`);
        
        // Look up handler
        const handler = this.services.get(method);
        if (!handler) {
            return {
                id,
                error: {
                    code: 404,
                    message: `Unknown method: ${method}`
                }
            };
        }

        try {
            // Call service function
            const result = await handler(params || {});
            
            // Log successful service call
            logger.logServiceCall(method, params, result);
            
            return { id, result };
        } catch (error) {
            // Log service error
            logger.logServiceError(method, params, error);
            
            return {
                id,
                error: {
                    code: 500,
                    message: `Internal error in ${method}`,
                    details: String(error)
                }
            };
        }
    }

    /**
     * Handle socket data
     */
    private async handleSocketData(socket: net.Socket, data: any): Promise<void> {
        try {
            const message = JSON.parse(data.toString());
            logger.info(`Received message: ${JSON.stringify(message)}`);
            
            // Validate request format
            if (!message.id || !message.method) {
                const response: BaseResponse = {
                    id: message.id || 'unknown',
                    error: {
                        code: 400,
                        message: 'Invalid request format: missing id or method'
                    }
                };
                socket.write(JSON.stringify(response));
                return;
            }
            
            // Handle request
            const response = await this.handleRequest(message);
            
            // Send response
            socket.write(JSON.stringify(response));
            logger.info(`Sent response for ${message.method}: ${response.result ? 'success' : 'error'}`);
            
        } catch (error) {
            logger.error(`Error handling socket data: ${error}`);
            
            const errorResponse: BaseResponse = {
                id: 'unknown',
                error: {
                    code: 500,
                    message: 'Internal server error',
                    details: String(error)
                }
            };
            
            socket.write(JSON.stringify(errorResponse));
        }
    }

    /**
     * Start the socket server
     */
    async start(): Promise<void> {
        if (this.server) {
            throw new Error('Socket server is already running');
        }

        // Clean up existing socket file if it exists
        if (this.socketPath && fs.existsSync(this.socketPath)) {
            try {
                fs.unlinkSync(this.socketPath);
                logger.info('Removed existing socket file');
            } catch (error) {
                logger.error(`Error removing existing socket file: ${error}`);
            }
        }

        return new Promise((resolve, reject) => {
            this.server = net.createServer();
            
            this.server.on('connection', (socket) => {
                logger.info(`Client connected to socket: ${this.socketPath}`);
                
                socket.on('data', (data) => {
                    this.handleSocketData(socket, data);
                });
                
                socket.on('close', () => {
                    logger.info('Client disconnected');
                });
                
                socket.on('error', (error) => {
                    logger.error(`Socket error: ${error}`);
                });
            });
            
            this.server.on('error', (error) => {
                logger.error(`Server error: ${error}`);
                reject(error);
            });
            
            this.server.listen(this.socketPath!, () => {
                logger.info(`Socket server listening on: ${this.socketPath}`);
                resolve();
            });
        });
    }

    /**
     * Stop the socket server and cleanup
     */
    cleanup(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            logger.info('Socket server closed');
        }
        
        if (this.socketPath && fs.existsSync(this.socketPath)) {
            try {
                fs.unlinkSync(this.socketPath);
                logger.info(`Socket file removed: ${this.socketPath}`);
            } catch (error) {
                logger.error(`Error removing socket file: ${error}`);
            }
        }
        
        this.socketPath = null;
    }

    /**
     * Get the socket path
     */
    getSocketPath(): string | null {
        return this.socketPath;
    }

    /**
     * Get registered services count
     */
    getServicesCount(): number {
        return this.services.size;
    }
} 