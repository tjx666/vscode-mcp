import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { resolveSymbolPosition } from './resolve-symbol-position.js';
import { ensureFileIsOpen } from './utils.js';

/**
 * Handle get signature help
 */
export const getSignatureHelp = async (
    payload: EventParams<'getSignatureHelp'>
): Promise<EventResult<'getSignatureHelp'>> => {
    // Ensure file is open to get accurate signature help
    await ensureFileIsOpen(payload.uri);
    
    const uri = vscode.Uri.parse(payload.uri);
    
    // Resolve symbol to position - try to find function call position
    const position = await resolveSymbolPosition(uri, payload.symbol, payload.codeSnippet);
    
    // Execute signature help provider
    const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
        'vscode.executeSignatureHelpProvider',
        uri,
        position
    );
    
    if (!signatureHelp || signatureHelp.signatures.length === 0) {
        return { signatureHelp: null };
    }
    
    return {
        signatureHelp: {
            signatures: signatureHelp.signatures.map(sig => ({
                label: sig.label,
                documentation: typeof sig.documentation === 'string' 
                    ? sig.documentation 
                    : sig.documentation?.value,
                parameters: sig.parameters?.map(param => ({
                    label: typeof param.label === 'string' ? param.label : `${param.label[0]},${param.label[1]}`,
                    documentation: typeof param.documentation === 'string' 
                        ? param.documentation 
                        : param.documentation?.value
                })) || []
            })),
            activeSignature: signatureHelp.activeSignature,
            activeParameter: signatureHelp.activeParameter
        }
    };
}; 