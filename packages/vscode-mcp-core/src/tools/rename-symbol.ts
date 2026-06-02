import { createDispatcher, RenameSymbolInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

const DESCRIPTION = `Rename a symbol with VSCode F2 ability

Advantages over search and replace:

- Faster
- More accurate
- Automatically updates imports and reference locations

**Important Notes:**
- Some symbols may not be renameable (e.g., built-in types, external libraries)`;

export const renameSymbolTool: ToolDefinition<typeof RenameSymbolInputSchema> = {
  name: 'rename_symbol',
  cliName: 'rename-symbol',
  title: '⚠️ Rename Symbol',
  description: DESCRIPTION,
  schema: RenameSymbolInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
  async handler(params, { workspacePath }) {
    const { filePath, symbol, codeSnippet, newName } = params;
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('renameSymbol', { filePath, symbol, codeSnippet, newName });

    if (result.success) {
      const filesList = result.modifiedFiles
        .map((f) => `  📄 ${f.uri} (${f.changeCount} changes)`)
        .join('\n');

      return `✅ Successfully renamed '${result.symbolName}' to '${newName}'

📊 Summary:
- Total changes: ${result.totalChanges}
- Modified files: ${result.modifiedFiles.length}

📁 Files modified:
${filesList}`;
    }

    return `❌ Rename failed: ${result.error}

💡 **Troubleshooting Tips:**
- Make sure the symbol name is spelled correctly
- Try providing a codeSnippet if there are multiple symbols with the same name
- Some symbols cannot be renamed (e.g., built-in types, external libraries)
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running`;
  },
};
