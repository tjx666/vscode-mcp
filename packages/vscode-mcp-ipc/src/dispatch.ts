import { createHash } from 'node:crypto';
import { Socket } from 'node:net';

import type { BaseRequest, BaseResponse,EventName, EventParams, EventResult } from './events.js';

/**
 * Generate socket path based on workspace path
 */
export function getSocketPath(workspacePath: string): string {
  const hash = createHash('md5').update(workspacePath).digest('hex').slice(0, 8);

  return process.platform === 'win32'
    ? `\\\\.\\pipe\\vscode-mcp-${hash}`
    : `/tmp/vscode-mcp-${hash}.sock`;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Dispatcher class for sending events to VSCode extension via Unix Socket
 */
export class EventDispatcher {
  private workspacePath: string;
  private socketPath: string;
  private requestTimeout: number;

  constructor(workspacePath: string, requestTimeout: number = 30000) {
    this.workspacePath = workspacePath;
    this.socketPath = getSocketPath(workspacePath);
    this.requestTimeout = requestTimeout;
  }

  /**
   * Send event to VSCode extension and wait for response
   */
  async dispatch<T extends EventName>(
    eventName: T,
    params: EventParams<T>,
  ): Promise<EventResult<T>> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      const requestId = generateRequestId();
      let responseReceived = false;

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!responseReceived) {
          socket.destroy();
          reject(
            new Error(
              `Request timeout after ${this.requestTimeout}ms for event: ${eventName}`,
            ),
          );
        }
      }, this.requestTimeout);

      // Handle socket connection
      socket.on('connect', () => {
        const request: BaseRequest = {
          id: requestId,
          method: eventName,
          params: params as Record<string, any>,
        };

        socket.write(`${JSON.stringify(request)  }\n`);
      });

      // Handle socket data
      socket.on('data', (data) => {
        try {
          const response: BaseResponse = JSON.parse(data.toString());

          if (response.id === requestId) {
            responseReceived = true;
            clearTimeout(timeoutId);
            socket.destroy();

            if (response.error) {
              reject(
                new Error(
                  `VSCode extension error: ${response.error.message}${
                    response.error.details ? ` - ${response.error.details}` : ''
                  }`,
                ),
              );
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          responseReceived = true;
          clearTimeout(timeoutId);
          socket.destroy();
          reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`));
        }
      });

      // Handle socket errors
      socket.on('error', (error) => {
        responseReceived = true;
        clearTimeout(timeoutId);
        reject(
          new Error(
            `Failed to connect to VSCode extension at ${this.socketPath}: ${error.message}`,
          ),
        );
      });

      // Handle socket close
      socket.on('close', () => {
        if (!responseReceived) {
          clearTimeout(timeoutId);
          reject(
            new Error(
              `Connection closed unexpectedly for event: ${eventName}`,
            ),
          );
        }
      });

      // Connect to socket
      socket.connect(this.socketPath);
    });
  }

  /**
   * Test connection to VSCode extension
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.dispatch('health', {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get workspace path
   */
  getWorkspacePath(): string {
    return this.workspacePath;
  }

  /**
   * Get socket path
   */
  getSocketPath(): string {
    return this.socketPath;
  }
}

/**
 * Create a new event dispatcher instance
 */
export function createDispatcher(
  workspacePath: string,
  requestTimeout?: number,
): EventDispatcher {
  return new EventDispatcher(workspacePath, requestTimeout);
} 