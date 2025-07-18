import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { ensureFileIsOpen } from './utils.js';

const execAsync = promisify(exec);

/**
 * Get all git modified files in the workspace (staged and unstaged)
 */
async function getModifiedFiles(): Promise<string[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return [];
    }

    const workspaceRoot = workspaceFolder.uri.fsPath;
    const modifiedFiles: string[] = [];

    try {
        // Get unstaged changes
        const { stdout: unstagedFiles } = await execAsync('git diff --name-only', {
            cwd: workspaceRoot
        });

        // Get staged changes
        const { stdout: stagedFiles } = await execAsync('git diff --cached --name-only', {
            cwd: workspaceRoot
        });

        // Combine and process file paths
        const allFiles = new Set<string>();
        
        // Process unstaged files
        if (unstagedFiles.trim()) {
            unstagedFiles.trim().split('\n').forEach(filePath => {
                if (filePath.trim()) {
                    allFiles.add(filePath.trim());
                }
            });
        }

        // Process staged files
        if (stagedFiles.trim()) {
            stagedFiles.trim().split('\n').forEach(filePath => {
                if (filePath.trim()) {
                    allFiles.add(filePath.trim());
                }
            });
        }

        // Convert relative paths to absolute file URIs
        for (const relativePath of allFiles) {
            const absolutePath = path.resolve(workspaceRoot, relativePath);
            const uri = vscode.Uri.file(absolutePath);
            modifiedFiles.push(uri.toString());
        }

    } catch (error) {
        console.warn(`Error getting git modified files: ${error}`);
        // Fallback: return empty array if git commands fail
        return [];
    }

    return modifiedFiles;
}

/**
 * Handle get diagnostics for multiple files
 */
export const getDiagnostics = async (
    payload: EventParams<'getDiagnostics'>
): Promise<EventResult<'getDiagnostics'>> => {
    let targetUris = payload.uris;
    
    // If empty array is provided, get all git modified files
    if (targetUris.length === 0) {
        targetUris = await getModifiedFiles();
    }
    
    const files = await Promise.all(
        targetUris.map(async (uriString: string) => {
            // Ensure file is open to get accurate diagnostics
            await ensureFileIsOpen(uriString);
            
            const uri = vscode.Uri.parse(uriString);
            const diagnostics = vscode.languages.getDiagnostics(uri);
            
            return {
                uri: uriString,
                diagnostics: diagnostics.map(diag => ({
                    range: {
                        start: { line: diag.range.start.line, character: diag.range.start.character },
                        end: { line: diag.range.end.line, character: diag.range.end.character }
                    },
                    message: diag.message,
                    severity: diag.severity ,
                    source: diag.source,
                    code: typeof diag.code === 'object' ? diag.code.value : diag.code
                }))
            };
        })
    );

    return { files };
}; 