import { access, constants, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { WorkspaceInfo } from '@vscode-mcp/vscode-mcp-ipc';
import { EventDispatcher, getAppDataDir, getLegacyAppDataDir } from '@vscode-mcp/vscode-mcp-ipc';

function extractWorkspaceFromSocketName(socketFileName: string): string {
  const match = socketFileName.match(/vscode-mcp-([a-f0-9]+)\.sock$/);
  return match ? match[1] : 'unknown';
}

async function discoverInDirectory(appDir: string, isLegacy: boolean = false): Promise<string[]> {
  try {
    await access(appDir, constants.F_OK);
  } catch {
    return [];
  }

  try {
    const files = await readdir(appDir);
    return files
      .filter((f: string) => f.startsWith('vscode-mcp-') && f.endsWith('.sock'))
      .map((f: string) => join(appDir, f));
  } catch (error) {
    if (!isLegacy) {
      console.error('Failed to read socket directory:', error);
    }
    return [];
  }
}

export async function discoverAvailableWorkspaces(options: {
  cleanZombieSockets?: boolean;
  testConnection?: boolean;
  includeDetails?: boolean;
} = {}): Promise<{ workspaces: WorkspaceInfo[]; hasLegacyWorkspaces: boolean }> {
  const { cleanZombieSockets = true, testConnection = true } = options;

  const appDir = getAppDataDir();
  let socketFiles = await discoverInDirectory(appDir, false);

  let hasLegacyWorkspaces = false;
  if (socketFiles.length === 0) {
    const legacyAppDir = getLegacyAppDataDir();
    if (legacyAppDir) {
      const legacySocketFiles = await discoverInDirectory(legacyAppDir, true);
      if (legacySocketFiles.length > 0) {
        console.warn(`⚠️  Found workspaces using legacy socket paths in: ${legacyAppDir}`);
        console.warn(`   Please upgrade VSCode MCP Bridge extension to use new path: ${appDir}`);
        socketFiles = legacySocketFiles;
        hasLegacyWorkspaces = true;
      }
    }
  }

  const promises = socketFiles.map(async (socketPath) => {
    if (!testConnection) {
      return {
        workspace_path: extractWorkspaceFromSocketName(socketPath),
        status: 'available' as const,
        socket_path: socketPath,
      };
    }

    try {
      const tempDispatcher = new EventDispatcher('temp', 2000);
      // Override the auto-derived socket path with the one we discovered on disk.
      // The constructor's hashing assumes a known workspace path; we don't have it
      // yet — we only learn it from the health response below.
      (tempDispatcher as any).socketPath = socketPath;
      const healthResult = await tempDispatcher.dispatch('health', {});

      const workspaceInfo: WorkspaceInfo = {
        workspace_path: healthResult.workspace || extractWorkspaceFromSocketName(socketPath),
        status: 'active',
        socket_path: socketPath,
        extension_version: healthResult.extension_version,
        last_seen: healthResult.timestamp,
        vscode_version: healthResult.system_info?.vscode_version,
      };

      return workspaceInfo;
    } catch (error) {
      if (cleanZombieSockets) {
        try {
          const { unlink } = await import('node:fs/promises');
          await unlink(socketPath);
          console.log(`Cleaned zombie socket: ${socketPath}`);
        } catch (cleanError) {
          console.warn(`Failed to clean zombie socket ${socketPath}:`, cleanError);
        }
        return null;
      }
      return {
        workspace_path: extractWorkspaceFromSocketName(socketPath),
        status: 'error' as const,
        socket_path: socketPath,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const results = await Promise.all(promises);
  const workspaces = results.filter((result): result is WorkspaceInfo => result !== null);

  return { workspaces, hasLegacyWorkspaces };
}
