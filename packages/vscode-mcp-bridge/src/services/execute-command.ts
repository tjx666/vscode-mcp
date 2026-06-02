// cSpell:ignore Jsonifiable
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
 * Serialize a VSCode Range to a plain object
 */
function serializeRange(range: any): { start: { line: number; character: number }; end: { line: number; character: number } } {
    return {
        start: { line: range.start.line, character: range.start.character },
        end: { line: range.end.line, character: range.end.character },
    };
}

/**
 * Recursively serialize VSCode objects that have non-enumerable properties
 * (e.g. DocumentSymbol.children is a getter that gets lost during JSON.stringify/structuredClone)
 */
function serializeVscodeValue(value: unknown): unknown {
    if (value == null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(serializeVscodeValue);
    }

    const obj = value as Record<string, any>;

    // DocumentSymbol: has name, kind, range, selectionRange, children
    if ('name' in obj && 'kind' in obj && 'range' in obj && 'selectionRange' in obj) {
        return {
            name: obj.name,
            detail: obj.detail,
            kind: obj.kind,
            tags: obj.tags,
            range: serializeRange(obj.range),
            selectionRange: serializeRange(obj.selectionRange),
            children: Array.isArray(obj.children)
                ? obj.children.map(serializeVscodeValue)
                : [],
        };
    }

    // SymbolInformation: has name, kind, location, containerName (flat provider format)
    if ('name' in obj && 'kind' in obj && 'location' in obj && 'containerName' in obj) {
        return {
            name: obj.name,
            kind: obj.kind,
            containerName: obj.containerName,
            location: {
                uri: obj.location.uri?.toString?.() ?? obj.location.uri,
                range: serializeRange(obj.location.range),
            },
        };
    }

    // Range: has start.line and end.line
    if ('start' in obj && 'end' in obj && typeof obj.start?.line === 'number') {
        return serializeRange(obj);
    }

    // Location: has uri and range
    if ('uri' in obj && 'range' in obj && typeof obj.range?.start?.line === 'number') {
        return {
            uri: obj.uri?.toString?.() ?? obj.uri,
            range: serializeRange(obj.range),
        };
    }

    return value;
}

/**
 * Convert unknown value to Jsonifiable, with fallback for non-serializable values
 */
function toJsonifiable(value: unknown): Jsonifiable {
    // Pre-pass: handle VSCode objects with non-enumerable properties (e.g. DocumentSymbol.children)
    const serialized = serializeVscodeValue(value);
    if (isJsonifiable(serialized)) {
        return serialized;
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
    const { command, args, saveAllEditors } = payload;
    
    try {
        // Parse JSON string arguments if provided
        let parsedArgs: unknown[] = [];
        if (args) {
            try {
                parsedArgs = JSON.parse(args);
                if (!Array.isArray(parsedArgs)) {
                    throw new TypeError('Args must be an array');
                }
            } catch (parseError) {
                throw new Error(`Invalid JSON in args parameter: ${parseError instanceof Error ? parseError.message : String(parseError)}`, { cause: parseError });
            }
        }
        
        // Process arguments to convert URI strings to vscode.Uri objects
        const processedArgs = processArguments(parsedArgs);
        
        // Execute the VSCode command
        const result = await vscode.commands.executeCommand(command, ...processedArgs);
        
        // Save all dirty editors after command execution if requested
        if (saveAllEditors) {
            await vscode.workspace.saveAll(false);
        }
        
        return {
            result: toJsonifiable(result)
        };
    } catch (error) {
        // If the command fails, we still return a result but with error information
        return {
            result: {
                error: error instanceof Error ? error.message : String(error),
                command,
                args: args || ''
            }
        };
    }
}; 