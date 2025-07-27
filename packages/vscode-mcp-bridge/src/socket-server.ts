import * as fs from 'fs';
import * as net from 'net';

import type { BaseRequest, BaseResponse, EventName } from '@vscode-mcp/vscode-mcp-ipc';
import { getSocketPath } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

import { logger } from './logger';

type ServiceFunction = (
    payload: any
) => Promise<any>;

/**
 * Service registration information
 */
interface ServiceRegistration {
    handler: ServiceFunction;
    payloadSchema?: z.ZodSchema<any>;
    resultSchema?: z.ZodSchema<any>;
}

/**
 * Service registration options
 */
interface ServiceRegistrationOptions {
    handler: ServiceFunction;
    payloadSchema?: z.ZodSchema<any>;
    resultSchema?: z.ZodSchema<any>;
}

/**
 * Socket Server for handling MCP communication
 */
export class SocketServer {
    private server: net.Server | null = null;
    private socketPath: string | null = null;
    private services: Map<string, ServiceRegistration> = new Map();

    constructor(workspacePath: string) {
        this.socketPath = getSocketPath(workspacePath);
    }

    /**
     * Register a service handler with optional schema validation
     */
    register(method: EventName, options: ServiceRegistrationOptions): void {
        this.services.set(method, {
            handler: options.handler,
            payloadSchema: options.payloadSchema,
            resultSchema: options.resultSchema
        });
        logger.info(`Registered service: ${method}`);
    }

    /**
     * Handle incoming request and route to appropriate service
     */
    private async handleRequest(request: BaseRequest): Promise<BaseResponse> {
        const { id, method, params } = request;
        
        logger.info(`Processing request: ${method}`);
        
        // Look up service registration
        const registration = this.services.get(method);
        if (!registration) {
            return {
                id,
                error: {
                    code: 404,
                    message: `Unknown method: ${method}`
                }
            };
        }

        try {
            // Validate payload if schema is provided
            let validatedPayload = params || {};
            if (registration.payloadSchema) {
                try {
                    validatedPayload = registration.payloadSchema.parse(params || {});
                } catch (validationError) {
                    return {
                        id,
                        error: {
                            code: 400,
                            message: `Invalid payload for ${method}`,
                            details: validationError instanceof z.ZodError 
                                ? validationError.errors.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')
                                : String(validationError)
                        }
                    };
                }
            }

            // Call service function
            const result = await registration.handler(validatedPayload);

            // Validate result if schema is provided
            if (registration.resultSchema) {
                try {
                    registration.resultSchema.parse(result);
                } catch (validationError) {
                    // Log the actual result value that failed validation
                    logger.error(`Result validation failed for ${method}:`);
                    logger.error(`Actual result: ${JSON.stringify(result, null, 2)}`);
                    logger.error(`Validation error: ${validationError}`);
                    return {
                        id,
                        error: {
                            code: 500,
                            message: `Invalid result from ${method}`,
                            details: validationError instanceof z.ZodError 
                                ? validationError.errors.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')
                                : String(validationError)
                        }
                    };
                }
            }
            
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

        // Clean up existing socket file if it exists (Unix-like systems only)
        if (this.socketPath && process.platform !== 'win32' && fs.existsSync(this.socketPath)) {
            try {
                fs.unlinkSync(this.socketPath);
                logger.info('Removed existing socket file');
            } catch (error) {
                logger.error(`Error removing existing socket file: ${error}`);
                // If the file is in use by another process, fail fast
                if ((error as NodeJS.ErrnoException).code === 'EBUSY' || (error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
                    throw new Error('Socket is already in use by another VSCode instance');
                }
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
        
        if (this.socketPath && process.platform !== 'win32' && fs.existsSync(this.socketPath)) {
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