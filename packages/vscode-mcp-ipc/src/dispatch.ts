import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { Socket } from 'node:net';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

import type { BaseRequest, BaseResponse, EventName, EventParams, EventResult } from './events/index.js';

/**
 * Get application data directory for storing socket files
 */
export function getAppDataDir(): string {
  const appName = 'YuTengjing.vscode-mcp';
  const homeDir = homedir();
  
  switch (process.platform) {
    case 'darwin':
      // macOS: Use Application Support directory
      return join(homeDir, 'Library', 'Application Support', appName);
      
    case 'win32':
      // Windows: Using named pipes, no directory needed
      return '';
      
    default: {
      // Linux and other Unix-like: Follow XDG Base Directory spec
      const linuxAppName = appName.toLowerCase().replaceAll('.', '-');
      const xdgData = process.env.XDG_DATA_HOME || join(homeDir, '.local', 'share');
      return join(xdgData, linuxAppName);
    }
  }
}

/**
 * Generate socket path based on workspace path
 */
export function getSocketPath(workspacePath: string): string {
  const hash = createHash('md5').update(workspacePath).digest('hex').slice(0, 8);

  if (process.platform === 'win32') {
    // Windows: Use named pipes
    return `\\\\.\\pipe\\vscode-mcp-${hash}`;
  }

  // Unix-like systems: Use socket files in app data directory
  const appDir = getAppDataDir();
  
  // Ensure directory exists
  if (!existsSync(appDir)) {
    mkdirSync(appDir, { recursive: true, mode: 0o700 });
  }
  
  return join(appDir, `vscode-mcp-${hash}.sock`);
}

/**
 * Get legacy application data directory (using tmpdir)
 */
export function getLegacyAppDataDir(): string {
  if (process.platform === 'win32') {
    return ''; // Windows uses named pipes, no directory
  }
  return tmpdir();
}

/**
 * Generate legacy socket path (for backward compatibility)
 */
function getLegacySocketPath(workspacePath: string): string {
  const hash = createHash('md5').update(workspacePath).digest('hex').slice(0, 8);

  return process.platform === 'win32'
    ? `\\\\.\\pipe\\vscode-mcp-${hash}`
    : join(tmpdir(), `vscode-mcp-${hash}.sock`);
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
  private legacySocketPath: string;
  private requestTimeout: number;

  constructor(workspacePath: string, requestTimeout: number = 30000) {
    this.workspacePath = workspacePath;
    this.socketPath = getSocketPath(workspacePath);
    this.legacySocketPath = getLegacySocketPath(workspacePath);
    this.requestTimeout = requestTimeout;
  }

  /**
   * Send event to VSCode extension and wait for response
   */
  async dispatch<T extends EventName>(
    eventName: T,
    params: EventParams<T>,
  ): Promise<EventResult<T>> {
    // Try new socket path first
    try {
      return await this.tryConnect(eventName, params, this.socketPath);
    } catch (newPathError) {
      // Check if this is a connection error or business error
      const isConnectionError = this.isConnectionError(newPathError as Error);
      
      if (!isConnectionError) {
        // This is a business error (e.g., file not found, invalid params), not connection issue
        // Don't retry, let outer layer handle it
        throw newPathError;
      }
      
      // This is a connection error, try legacy path
      try {
        const result = await this.tryConnect(eventName, params, this.legacySocketPath);
        
        // If legacy path works, show upgrade warning
        console.warn(
          `⚠️  Connected using legacy socket path. Please upgrade your VSCode MCP Bridge extension to the latest version.\n` +
          `   Extension: YuTengjing.vscode-mcp-bridge\n` +
          `   Current connection: ${this.legacySocketPath}\n` +
          `   Expected new path: ${this.socketPath}\n` +
          `   Workspace: ${this.workspacePath}`
        );
        
        return result;
      } catch (legacyPathError) {
        const isLegacyConnectionError = this.isConnectionError(legacyPathError as Error);
        
        if (!isLegacyConnectionError) {
          // Legacy path connected but returned business error, throw it
          throw legacyPathError;
        }
        
        // Both paths failed with connection errors
        throw new Error(
          `Failed to connect to VSCode extension at both locations:\n` +
          `  New path: ${this.socketPath} - ${(newPathError as Error).message}\n` +
          `  Legacy path: ${this.legacySocketPath} - ${(legacyPathError as Error).message}\n\n` +
          `Please ensure:\n` +
          `  1. VSCode MCP Bridge extension is installed and activated\n` +
          `  2. A workspace is open in VSCode\n` +
          `  3. Extension is updated to the latest version`
        );
      }
    }
  }

  /**
   * Check if error is a connection error (vs business logic error from VSCode extension)
   */
  private isConnectionError(error: Error): boolean {
    const { message } = error;
    return message.includes('connect ENOENT') && message.includes('.sock');
  }

  /**
   * Try to connect to a specific socket path
   */
  private async tryConnect<T extends EventName>(
    eventName: T,
    params: EventParams<T>,
    socketPath: string,
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

        socket.write(`${JSON.stringify(request)}\n`);
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
            `Failed to connect to VSCode extension at ${socketPath}: ${error.message}`,
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
      socket.connect(socketPath);
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


 