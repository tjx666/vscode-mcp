import type { EventParams, EventResult, Jsonifiable } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Check if a value is JSON serializable
 */
function isJsonifiable(value: unknown): value is Jsonifiable {
    // undefined is not JSON serializable (it gets omitted in objects, converted to null in arrays)
    if (value === undefined) {
        return false;
    }
    
    try {
        JSON.stringify(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * Convert unknown value to Jsonifiable, with fallback for non-serializable values
 */
function toJsonifiable(value: unknown): Jsonifiable {
    if (isJsonifiable(value)) {
        return value;
    }
    
    // Fallback for non-serializable values
    if (typeof value === 'function') {
        return '[Function]';
    }
    if (typeof value === 'symbol') {
        return '[Symbol]';
    }
    if (value === undefined) {
        return null;
    }
    
    // Try to convert objects to a serializable format
    try {
        // Use structuredClone to create a deep copy, then verify it's JSON serializable
        const cloned = structuredClone(value);
        return isJsonifiable(cloned) ? cloned : String(value);
    } catch {
        return String(value);
    }
}

/**
 * Process arguments to convert them to appropriate VSCode types
 */
function processArguments(args: unknown[]): unknown[] {
    return args.map(arg => {
        // Convert URI strings to vscode.Uri objects
        if (typeof arg === 'string' && (arg.startsWith('file://') || arg.startsWith('vscode://') || arg.startsWith('http://') || arg.startsWith('https://'))) {
            try {
                return vscode.Uri.parse(arg);
            } catch {
                // If parsing fails, return the original string
                return arg;
            }
        }
        
        // Keep other arguments as-is
        return arg;
    });
}

/**
 * Handle execute command
 */
export const executeCommand = async (
    payload: EventParams<'executeCommand'>
): Promise<EventResult<'executeCommand'>> => {
    const { command, args } = payload;
    
    try {
        // Process arguments to convert URI strings to vscode.Uri objects
        const processedArgs = args ? processArguments(args) : [];
        
        // Execute the VSCode command
        const result = await vscode.commands.executeCommand(command, ...processedArgs);
        
        return {
            result: toJsonifiable(result)
        };
    } catch (error) {
        // If the command fails, we still return a result but with error information
        return {
            result: {
                error: error instanceof Error ? error.message : String(error),
                command,
                args: args || []
            }
        };
    }
}; 