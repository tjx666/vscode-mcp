import { access, constants, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { createDispatcher, EventDispatcher, getAppDataDir, type WorkspaceInfo } from '@vscode-mcp/vscode-mcp-ipc';

/**
 * Extract workspace path from socket file name
 */
function extractWorkspaceFromSocketName(socketFileName: string): string {
  // Socket file format: vscode-mcp-{hash}.sock
  // We can't reverse the hash, so we need to connect to get the real path
  // For now, return the hash as identifier
  const match = socketFileName.match(/vscode-mcp-([a-f0-9]+)\.sock$/);
  return match ? match[1] : 'unknown';
}

/**
 * Discover all available workspaces
 */
export async function discoverAvailableWorkspaces(options: {
  cleanZombieSockets?: boolean;
  testConnection?: boolean;
  includeDetails?: boolean;
} = {}): Promise<WorkspaceInfo[]> {
  const {
    cleanZombieSockets = true,
    testConnection = true,
    includeDetails = false
  } = options;
  
  const appDir = getAppDataDir();
  let socketFiles: string[] = [];
  
  // Check if app directory exists
  try {
    await access(appDir, constants.F_OK);
  } catch {
    return [];
  }
  
  try {
    // Read all socket files
    const files = await readdir(appDir);
    socketFiles = files
      .filter((f: string) => f.startsWith('vscode-mcp-') && f.endsWith('.sock'))
      .map((f: string) => join(appDir, f));
  } catch (error) {
    console.error('Failed to read socket directory:', error);
    return [];
  }
  
  // Process all sockets in parallel for better performance
  const promises = socketFiles.map(async (socketPath) => {
    if (!testConnection) {
      // Just list files without testing
      return {
        workspace_path: extractWorkspaceFromSocketName(socketPath),
        status: 'available' as const,
        socket_path: socketPath
      };
    }
    
    // Test if socket is active and get real workspace info
    try {
      // Create a temporary dispatcher for the specific socket
      const tempDispatcher = new EventDispatcher('temp', 2000);
      // Override the socket path to use the discovered socket
      (tempDispatcher as any).socketPath = socketPath;
      const healthResult = await tempDispatcher.dispatch('health', {});
      
      // Successfully connected, populate with real workspace info
      const workspaceInfo: WorkspaceInfo = {
        workspace_path: healthResult.workspace || extractWorkspaceFromSocketName(socketPath),
        status: 'active',
        socket_path: socketPath,
        extension_version: healthResult.extension_version,
        last_seen: healthResult.timestamp
      };
      
      // Add detailed info if requested
      if (includeDetails) {
        workspaceInfo.vscode_version = healthResult.system_info?.vscode_version;
      }
      
      return workspaceInfo;
    } catch (error) {
      // Connection failed, this is a zombie socket
      if (cleanZombieSockets) {
        // Socket is dead, clean it up
        try {
          const { unlink } = await import('node:fs/promises');
          await unlink(socketPath);
          console.log(`Cleaned zombie socket: ${socketPath}`);
        } catch (cleanError) {
          console.warn(`Failed to clean zombie socket ${socketPath}:`, cleanError);
        }
        return null; // Cleaned socket, don't include in results
      } else {
        // Mark as error but don't clean
        return {
          workspace_path: extractWorkspaceFromSocketName(socketPath),
          status: 'error' as const,
          socket_path: socketPath,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
  });
  
  const results = await Promise.all(promises);
  
  // Filter out null results (cleaned or inactive sockets)
  return results.filter((result): result is WorkspaceInfo => result !== null);
}