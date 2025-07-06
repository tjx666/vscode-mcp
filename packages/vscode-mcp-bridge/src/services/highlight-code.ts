import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

// Store active decorations for cleanup
const activeDecorations = new Map<string, vscode.TextEditorDecorationType[]>();

// Predefined highlight styles for different types
const highlightStyles = {
  info: { backgroundColor: '#0ea5e9', color: '#ffffff' },      // Blue
  warning: { backgroundColor: '#f59e0b', color: '#ffffff' },   // Orange
  error: { backgroundColor: '#ef4444', color: '#ffffff' },     // Red
  success: { backgroundColor: '#10b981', color: '#ffffff' }    // Green
};

/**
 * Handle highlighting code ranges in files
 */
export const highlightCode = async (
    payload: EventParams<'highlightCode'>
): Promise<EventResult<'highlightCode'>> => {
    try {
        const uri = vscode.Uri.parse(payload.uri);
        
        // Open the document if needed
        const document = await vscode.workspace.openTextDocument(uri);
        
        // Show in editor if requested
        const showEditor = payload.showEditor ?? true;
        let editor: vscode.TextEditor | undefined;
        
        if (showEditor) {
            editor = await vscode.window.showTextDocument(document, {
                preview: false,
                preserveFocus: false
            });
        } else {
            // Try to find existing editor for this document
            editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
        }

        // Clear previous highlights if requested
        let clearedCount = 0;
        if (payload.clearPrevious) {
            const fileKey = uri.toString();
            const existingDecorations = activeDecorations.get(fileKey);
            if (existingDecorations) {
                existingDecorations.forEach(decoration => decoration.dispose());
                clearedCount = existingDecorations.length;
                activeDecorations.delete(fileKey);
            }
        }

        // Create new decorations
        const decorations: vscode.TextEditorDecorationType[] = [];
        const decorationRanges = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

        // Group ranges by type for efficient decoration
        const rangesByType = new Map<string, Array<{range: vscode.Range, message?: string, backgroundColor?: string, foregroundColor?: string}>>();
        
        for (const rangeSpec of payload.ranges) {
            try {
                // Validate line numbers against document
                const maxLine = document.lineCount - 1;
                const startLine = Math.max(0, Math.min(rangeSpec.startLine, maxLine));
                const endLine = Math.max(startLine, Math.min(rangeSpec.endLine, maxLine));
                
                // Create range
                const startPos = new vscode.Position(
                    startLine, 
                    rangeSpec.startCharacter ?? 0
                );
                const endPos = new vscode.Position(
                    endLine, 
                    rangeSpec.endCharacter ?? document.lineAt(endLine).text.length
                );
                const range = new vscode.Range(startPos, endPos);

                const type = rangeSpec.type ?? 'info';
                if (!rangesByType.has(type)) {
                    rangesByType.set(type, []);
                }
                rangesByType.get(type)!.push({ range, message: rangeSpec.message, backgroundColor: rangeSpec.backgroundColor, foregroundColor: rangeSpec.foregroundColor });
            } catch (error) {
                console.warn(`Failed to create range for ${rangeSpec.startLine}:${rangeSpec.endLine}:`, error);
            }
        }

        // Create decorations for each type
        for (const [type, ranges] of rangesByType) {
            const style = highlightStyles[type as keyof typeof highlightStyles] || highlightStyles.info;
            
            // Group ranges by their custom colors to minimize decoration types
            const colorGroups = new Map<string, Array<{range: vscode.Range, message?: string}>>();
            
            for (const { range, message, backgroundColor, foregroundColor } of ranges) {
                const bgColor = backgroundColor || style.backgroundColor;
                const fgColor = foregroundColor || style.color;
                const colorKey = `${bgColor}-${fgColor}`;
                
                if (!colorGroups.has(colorKey)) {
                    colorGroups.set(colorKey, []);
                }
                colorGroups.get(colorKey)!.push({ range, message });
            }
            
            // Create decoration type for each color combination
            for (const [colorKey, colorRanges] of colorGroups) {
                const [bgColor, fgColor] = colorKey.split('-');
                
                const decorationType = vscode.window.createTextEditorDecorationType({
                    backgroundColor: bgColor,
                    color: fgColor,
                    overviewRulerColor: bgColor,
                    overviewRulerLane: vscode.OverviewRulerLane.Right,
                    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
                });

                decorations.push(decorationType);
                
                // Apply decorations to editor if available
                if (editor) {
                    const decorationOptions: vscode.DecorationOptions[] = colorRanges.map(({ range, message }) => ({
                        range,
                        hoverMessage: message ? new vscode.MarkdownString(message) : undefined
                    }));
                    
                    editor.setDecorations(decorationType, decorationOptions);
                    decorationRanges.set(decorationType, colorRanges.map(r => r.range));
                }
            }
        }

        // Store decorations for cleanup
        const fileKey = uri.toString();
        activeDecorations.set(fileKey, decorations);

        // Scroll to first highlight if requested
        if (payload.scrollToFirst && editor && payload.ranges.length > 0) {
            const firstRange = payload.ranges[0];
            const firstPosition = new vscode.Position(firstRange.startLine, firstRange.startCharacter ?? 0);
            editor.revealRange(new vscode.Range(firstPosition, firstPosition), vscode.TextEditorRevealType.InCenter);
        }

        // Set auto-clear timeout if specified
        if (payload.timeout && payload.timeout > 0) {
            setTimeout(() => {
                decorations.forEach(decoration => decoration.dispose());
                activeDecorations.delete(fileKey);
            }, payload.timeout);
        }

        return {
            success: true,
            highlightCount: payload.ranges.length,
            clearedCount,
            message: `Successfully highlighted ${payload.ranges.length} range(s)${clearedCount > 0 ? ` and cleared ${clearedCount} previous highlight(s)` : ''}`
        };
    } catch (error) {
        return {
            success: false,
            highlightCount: 0,
            message: `Failed to highlight code: ${String(error)}`
        };
    }
};

/**
 * Clear all highlights for a file
 */
export const clearHighlights = (fileUri: string): number => {
    const decorations = activeDecorations.get(fileUri);
    if (decorations) {
        decorations.forEach(decoration => decoration.dispose());
        activeDecorations.delete(fileUri);
        return decorations.length;
    }
    return 0;
};

/**
 * Clear all highlights across all files
 */
export const clearAllHighlights = (): number => {
    let totalCleared = 0;
    for (const [, decorations] of activeDecorations) {
        decorations.forEach(decoration => decoration.dispose());
        totalCleared += decorations.length;
    }
    activeDecorations.clear();
    return totalCleared;
}; 