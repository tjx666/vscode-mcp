import type { EventParams, EventResult, LSPInfoType } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { getUsageCode } from '../utils/usage-code.js';
import { resolveSymbolPosition } from './resolve-symbol-position.js';
import { ensureFileIsOpen, resolveFilePath } from './utils.js';

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
    const { filePath, symbol, codeSnippet, infoType = 'all' } = payload;
    
    // Determine which info types to retrieve
    const shouldRetrieveAll = infoType === 'all';
    const typesToRetrieve = shouldRetrieveAll 
        ? ['hover', 'signature_help', 'type_definition', 'definition', 'implementation'] as LSPInfoType[]
        : [infoType] as LSPInfoType[];
    
    // Resolve file path to URI
    const vscodeUri = resolveFilePath(filePath);
    
    // Ensure file is open to get accurate LSP information
    await ensureFileIsOpen(vscodeUri.toString());
    
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
                    if (hovers && hovers.length > 0) {
                        result.hover = hovers.map(hover => ({
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
                        }));
                    }
                } catch (error) {
                    result.hover = [{ contents: [`Error getting hover info: ${error}`] }];
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
                    if (signatureHelp) {
                        result.signature_help = {
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
                        };
                    }
                } catch (error) {
                    result.signature_help = {
                        signatures: [{
                            label: `Error getting signature help: ${error}`,
                            parameters: []
                        }],
                        activeSignature: 0,
                        activeParameter: 0
                    };
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
                    if (definitions && definitions.length > 0) {
                        const locations = definitions.map(convertLocationToStandard);
                        result.type_definition = await addUsageCodeToLocations(locations);
                    }
                } catch (error) {
                    result.type_definition = [{
                        uri: `error://type-definition`,
                        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                        usageCode: `Error getting type definition: ${error}`
                    }];
                }
            })()
        );
    }
    
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
                    if (definitions && definitions.length > 0) {
                        const locations = definitions.map(convertLocationToStandard);
                        result.definition = await addUsageCodeToLocations(locations);
                    }
                } catch (error) {
                    result.definition = [{
                        uri: `error://definition`,
                        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                        usageCode: `Error getting definition: ${error}`
                    }];
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
                    if (implementations && implementations.length > 0) {
                        const locations = implementations.map(convertLocationToStandard);
                        result.implementation = await addUsageCodeToLocations(locations);
                    }
                } catch (error) {
                    result.implementation = [{
                        uri: `error://implementation`,
                        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                        usageCode: `Error getting implementation: ${error}`
                    }];
                }
            })()
        );
    }
    
    // Wait for all LSP providers to complete
    await Promise.all(tasks);
    
    return result;
};
