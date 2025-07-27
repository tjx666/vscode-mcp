import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { ensureFileIsOpen } from './utils.js';

const execAsync = promisify(exec);

/**
 * Get all git modified files in the workspace (staged, unstaged, and untracked)
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

        // Get untracked files (new files not yet added to git)
        const { stdout: untrackedFiles } = await execAsync('git ls-files --others --exclude-standard', {
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

        // Process untracked files
        if (untrackedFiles.trim()) {
            untrackedFiles.trim().split('\n').forEach(filePath => {
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
    const { sources, severities } = payload;
    
    // If empty array is provided, get all git modified files
    if (targetUris.length === 0) {
        targetUris = await getModifiedFiles();
    }
    
    // Severity mapping from VSCode number to string
    const severityNumberToString = {
        0: 'error',
        1: 'warning',
        2: 'info',
        3: 'hint'
    } as const;
    
    const files = await Promise.all(
        targetUris.map(async (uriString: string) => {
            // Ensure file is open to get accurate diagnostics
            await ensureFileIsOpen(uriString);
            
            const uri = vscode.Uri.parse(uriString);
            const allDiagnostics = vscode.languages.getDiagnostics(uri);
            
            // Filter diagnostics based on sources and severities
            const filteredDiagnostics = allDiagnostics.filter(diag => {
                // Filter by source (empty array means include all sources)
                const sourceMatches = sources.length === 0 || 
                    (diag.source ? sources.some(s => diag.source!.toLowerCase().includes(s.toLowerCase())) : false);
                
                // Filter by severity (empty array means include all severities) 
                const diagSeverityString = severityNumberToString[diag.severity];
                const severityMatches = severities.length === 0 || severities.includes(diagSeverityString);
                
                return sourceMatches && severityMatches;
            });
            
            return {
                uri: uriString,
                diagnostics: filteredDiagnostics.map(diag => ({
                    range: {
                        start: { line: diag.range.start.line, character: diag.range.start.character },
                        end: { line: diag.range.end.line, character: diag.range.end.character }
                    },
                    message: diag.message,
                    severity: severityNumberToString[diag.severity],
                    source: diag.source,
                    code: typeof diag.code === 'object' ? diag.code.value : diag.code
                }))
            };
        })
    );

    return { files };
}; 