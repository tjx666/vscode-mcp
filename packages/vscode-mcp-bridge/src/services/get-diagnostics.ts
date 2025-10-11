import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { logger } from '../logger.js';
import { ensureFileIsOpen, resolveFilePaths } from '../utils/workspace.js';

const execAsync = promisify(exec);

/**
 * Get all git modified files in the workspace (staged, unstaged, and untracked)
 * Returns absolute file paths
 */
async function getModifiedFiles(): Promise<string[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        logger.info('No workspace folder found, returning empty modified files list');
        return [];
    }

    const workspaceRoot = workspaceFolder.uri.fsPath;
    logger.info(`Getting git modified files from workspace: ${workspaceRoot}`);
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

        // Convert relative paths to absolute paths
        for (const relativePath of allFiles) {
            const absolutePath = path.resolve(workspaceRoot, relativePath);
            modifiedFiles.push(absolutePath);
        }

        logger.info(`Found ${modifiedFiles.length} git modified files: ${modifiedFiles.map(f => path.basename(f)).join(', ')}`);

    } catch (error) {
        logger.error(`Error getting git modified files: ${error}`);
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
    logger.info(`getDiagnostics called with ${payload.filePaths.length} file paths, sources: [${payload.sources.join(', ')}], severities: [${payload.severities.join(', ')}]`);
    
    let targetFilePaths = payload.filePaths;
    const { sources, severities } = payload;
    
    // If empty array is provided, get all git modified files
    if (targetFilePaths.length === 0) {
        logger.info('No file paths provided, getting git modified files');
        targetFilePaths = await getModifiedFiles();
    }
    
    // Convert file paths to URIs
    const targetUris = resolveFilePaths(targetFilePaths);
    
    // Severity mapping from VSCode number to string
    const severityNumberToString = {
        0: 'error',
        1: 'warning',
        2: 'info',
        3: 'hint'
    } as const;
    
    logger.info(`Processing diagnostics for ${targetUris.length} files`);
    
    const files = await Promise.all(
        targetUris.map(async (uri: vscode.Uri) => {
            // Ensure file is open to get accurate diagnostics
            await ensureFileIsOpen(uri.toString());
            
            // uri is already a VSCode Uri object
            const allDiagnostics = vscode.languages.getDiagnostics(uri);
            
            logger.info(`File ${path.basename(uri.fsPath)}: found ${allDiagnostics.length} total diagnostics`);
            
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
            
            logger.info(`File ${path.basename(uri.fsPath)}: after filtering - ${filteredDiagnostics.length} diagnostics (sources: ${filteredDiagnostics.map(d => d.source || 'unknown').join(', ') || 'none'})`);
            
            return {
                uri: uri.fsPath,
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

    const totalDiagnostics = files.reduce((sum, file) => sum + file.diagnostics.length, 0);
    logger.info(`getDiagnostics completed: ${totalDiagnostics} total diagnostics across ${files.length} files`);

    return { files };
}; 