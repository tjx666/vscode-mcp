import type { EventParams, EventResult, LSPInfoType } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { getUsageCode } from '../utils/usage-code.js';
import { resolveSymbolPosition } from './resolve-symbol-position.js';
import { ensureFileIsOpen } from './utils.js';

/**
 * Add usage code to location array
 */
async function addUsageCodeToLocations(locations: Array<{ uri: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } }>, lineRange: number = 5): Promise<Array<{ uri: string; range: { start: { line: number; character: number }; end: { line: number; character: number } }; usageCode?: string }>> {
    const result = await Promise.all(
        locations.map(async (location) => {
            const usageCode = await getUsageCode(
                vscode.Uri.parse(location.uri),
                new vscode.Range(
                    new vscode.Position(location.range.start.line, location.range.start.character),
                    new vscode.Position(location.range.end.line, location.range.end.character)
                ),
                lineRange
            );
            
            return {
                ...location,
                ...(usageCode && { usageCode })
            };
        })
    );
    
    return result;
}

/**
 * Handle get symbol LSP info - unified LSP information retrieval
 */
export const getSymbolLSPInfo = async (
    payload: EventParams<'getSymbolLSPInfo'>
): Promise<EventResult<'getSymbolLSPInfo'>> => {
    const { uri, symbol, codeSnippet, infoType = 'all' } = payload;
    
    // Determine which info types to retrieve
    const shouldRetrieveAll = infoType === 'all';
    const typesToRetrieve = shouldRetrieveAll 
        ? ['definition', 'type_definition', 'implementation', 'hover', 'signature_help'] as LSPInfoType[]
        : [infoType] as LSPInfoType[];
    
    // Ensure file is open to get accurate LSP information
    await ensureFileIsOpen(uri);
    
    const vscodeUri = vscode.Uri.parse(uri);
    
    // Resolve symbol to position
    const position = await resolveSymbolPosition(vscodeUri, symbol, codeSnippet);
    
    const result: EventResult<'getSymbolLSPInfo'> = {};
    
    /**
     * Helper function to convert location/link to standard format
     */
    const convertLocationToStandard = (def: vscode.Location | vscode.LocationLink) => {
        const isLocationLink = 'targetUri' in def;
        const uri = isLocationLink ? def.targetUri : def.uri;
        const range = isLocationLink ? def.targetRange : def.range;
        
        return {
            uri: uri.toString(),
            range: {
                start: { line: range.start.line, character: range.start.character },
                end: { line: range.end.line, character: range.end.character }
            }
        };
    };
    
    // Execute all LSP providers in parallel for better performance
    const tasks: Array<Promise<void>> = [];
    
    // Definition Provider
    if (typesToRetrieve.includes('definition')) {
        tasks.push(
            (async () => {
                try {
                    const definitions = await vscode.commands.executeCommand<Array<vscode.Location | vscode.LocationLink>>(
                        'vscode.executeDefinitionProvider',
                        vscodeUri,
                        position
                    );
                    const locations = definitions?.map(convertLocationToStandard) || [];
                    result.definition = await addUsageCodeToLocations(locations);
                } catch {
                    result.definition = [];
                }
            })()
        );
    }
    
    // Type Definition Provider
    if (typesToRetrieve.includes('type_definition')) {
        tasks.push(
            (async () => {
                try {
                    const definitions = await vscode.commands.executeCommand<Array<vscode.Location | vscode.LocationLink>>(
                        'vscode.executeTypeDefinitionProvider',
                        vscodeUri,
                        position
                    );
                    const locations = definitions?.map(convertLocationToStandard) || [];
                    result.type_definition = await addUsageCodeToLocations(locations);
                } catch {
                    result.type_definition = [];
                }
            })()
        );
    }
    
    // Implementation Provider
    if (typesToRetrieve.includes('implementation')) {
        tasks.push(
            (async () => {
                try {
                    const implementations = await vscode.commands.executeCommand<Array<vscode.Location | vscode.LocationLink>>(
                        'vscode.executeImplementationProvider',
                        vscodeUri,
                        position
                    );
                    const locations = implementations?.map(convertLocationToStandard) || [];
                    result.implementation = await addUsageCodeToLocations(locations);
                } catch {
                    result.implementation = [];
                }
            })()
        );
    }
    
    // Hover Provider
    if (typesToRetrieve.includes('hover')) {
        tasks.push(
            (async () => {
                try {
                    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                        'vscode.executeHoverProvider',
                        vscodeUri,
                        position
                    );
                    result.hover = hovers?.map(hover => ({
                        contents: hover.contents.map(content => {
                            if (typeof content === 'string') {
                                return content;
                            } else if (content instanceof vscode.MarkdownString) {
                                return content.value;
                            } else {
                                return content.toString();
                            }
                        }),
                        range: hover.range ? {
                            start: { line: hover.range.start.line, character: hover.range.start.character },
                            end: { line: hover.range.end.line, character: hover.range.end.character }
                        } : undefined
                    })) || [];
                } catch {
                    result.hover = [];
                }
            })()
        );
    }
    
    // Signature Help Provider
    if (typesToRetrieve.includes('signature_help')) {
        tasks.push(
            (async () => {
                try {
                    const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                        'vscode.executeSignatureHelpProvider',
                        vscodeUri,
                        position
                    );
                    result.signature_help = signatureHelp ? {
                        signatures: signatureHelp.signatures.map(sig => ({
                            label: sig.label,
                            documentation: sig.documentation instanceof vscode.MarkdownString 
                                ? sig.documentation.value 
                                : typeof sig.documentation === 'string' 
                                    ? sig.documentation 
                                    : undefined,
                            parameters: sig.parameters?.map(param => ({
                                label: typeof param.label === 'string' ? param.label : param.label.join(''),
                                documentation: param.documentation instanceof vscode.MarkdownString 
                                    ? param.documentation.value 
                                    : typeof param.documentation === 'string' 
                                        ? param.documentation 
                                        : undefined
                            }))
                        })),
                        activeSignature: signatureHelp.activeSignature,
                        activeParameter: signatureHelp.activeParameter
                    } : null;
                } catch {
                    result.signature_help = null;
                }
            })()
        );
    }
    
    // Wait for all LSP providers to complete
    await Promise.all(tasks);
    
    return result;
};
