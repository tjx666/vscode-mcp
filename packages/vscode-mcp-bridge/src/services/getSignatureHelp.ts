import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Handle get signature help
 */
export const getSignatureHelp = async (
    payload: EventParams<'getSignatureHelp'>
): Promise<EventResult<'getSignatureHelp'>> => {
    const uri = vscode.Uri.parse(payload.uri);
    const position = new vscode.Position(payload.line, payload.character);
    
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