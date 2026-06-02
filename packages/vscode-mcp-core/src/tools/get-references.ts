import { createDispatcher, GetReferencesInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

const DESCRIPTION = `Find all reference locations of a symbol (variable, function, class, etc.) across the codebase

**Return Format:**
Array of reference locations with file paths and exact positions
`;

export const getReferencesTool: ToolDefinition<typeof GetReferencesInputSchema> = {
  name: 'get_references',
  cliName: 'get-references',
  title: 'Get References',
  description: DESCRIPTION,
  schema: GetReferencesInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  async handler(params, { workspacePath }) {
    const { filePath, symbol, codeSnippet, includeDeclaration, usageCodeLineRange } = params;
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('getReferences', {
      filePath,
      symbol,
      codeSnippet,
      includeDeclaration,
      usageCodeLineRange,
    });

    if (result.locations && result.locations.length === 0) {
      return `❌ No references found for symbol "${symbol}" in ${filePath}

💡 **Troubleshooting Tips:**
- Make sure the symbol name is spelled correctly
- Try providing a codeSnippet if there are multiple symbols with the same name
- Try setting includeDeclaration: true to include the symbol definition itself
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running
- Some symbols may not have references if they're unused or only declared

📄 **Raw Result:**
${JSON.stringify(result, null, 2)}`;
    }

    return JSON.stringify(result, null, 2);
  },
};
