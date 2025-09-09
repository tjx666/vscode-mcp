import * as vscode from 'vscode';

/**
 * Resolve symbol name to precise position in a file
 */
export async function resolveSymbolPosition(
    uri: vscode.Uri,
    symbol: string,
    codeSnippet?: string
): Promise<vscode.Position> {
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();
    
    if (!codeSnippet) {
        // No codeSnippet: find symbol directly in entire file
        return findSymbolDirectly(text, symbol, document);
    }
    
    // With codeSnippet: find symbol within the specified code snippet
    return findSymbolInCodeSnippet(text, symbol, codeSnippet, document);
}

/**
 * Find symbol directly in the entire file
 */
function findSymbolDirectly(text: string, symbol: string, document: vscode.TextDocument): vscode.Position {
    const matches = findAllSymbolMatches(text, symbol, document);
    
    if (matches.length === 0) {
        throw new Error(`Symbol "${symbol}" not found in file`);
    }
    
    if (matches.length > 1) {
        throw new Error(`Multiple occurrences of "${symbol}" found. Please provide codeSnippet to disambiguate.`);
    }
    
    return matches[0];
}

/**
 * Find symbol within a specific code snippet
 */
function findSymbolInCodeSnippet(text: string, symbol: string, codeSnippet: string, document: vscode.TextDocument): vscode.Position {
    // 1. Find all occurrences of codeSnippet
    const snippetMatches: Array<{ start: number; end: number }> = [];
    let startIndex = 0;
    
    while (true) {
        const index = text.indexOf(codeSnippet, startIndex);
        if (index === -1) break;
        
        snippetMatches.push({
            start: index,
            end: index + codeSnippet.length
        });
        startIndex = index + 1;
    }
    
    if (snippetMatches.length === 0) {
        throw new Error(`Code snippet "${codeSnippet}" not found in file`);
    }
    
    if (snippetMatches.length > 1) {
        throw new Error(`Code snippet "${codeSnippet}" appears ${snippetMatches.length} times in file. Please be more specific.`);
    }
    
    // 2. Find symbol within the unique code snippet
    const snippetRange = snippetMatches[0];
    const snippetText = text.slice(snippetRange.start, snippetRange.end);
    
    const symbolRegex = new RegExp(`\\b${escapeRegExp(symbol)}\\b`, 'g');
    const symbolMatches: vscode.Position[] = [];
    let match: RegExpExecArray | null = symbolRegex.exec(snippetText);
    
    while (match !== null) {
        const absoluteIndex = snippetRange.start + match.index;
        symbolMatches.push(document.positionAt(absoluteIndex));
        match = symbolRegex.exec(snippetText);
    }
    
    if (symbolMatches.length === 0) {
        throw new Error(`Symbol "${symbol}" not found in code snippet "${codeSnippet}"`);
    }
    
    if (symbolMatches.length > 1) {
        throw new Error(`Multiple occurrences of "${symbol}" found in code snippet. Please use a more specific snippet.`);
    }
    
    return symbolMatches[0];
}

/**
 * Find all occurrences of a symbol in text
 */
function findAllSymbolMatches(text: string, symbol: string, document: vscode.TextDocument): vscode.Position[] {
    const matches: vscode.Position[] = [];
    const regex = new RegExp(`\\b${escapeRegExp(symbol)}\\b`, 'g');
    let match: RegExpExecArray | null = regex.exec(text);
    
    while (match !== null) {
        matches.push(document.positionAt(match.index));
        match = regex.exec(text);
    }
    
    return matches;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
    return string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}