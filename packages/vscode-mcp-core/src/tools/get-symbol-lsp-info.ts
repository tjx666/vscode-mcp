import { createDispatcher, GetSymbolLSPInfoInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

function formatLocationInfo(location: {
  uri: string;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  usageCode?: string;
}): string {
  const positionInfo = `${location.uri} @ ${location.range.start.line}:${location.range.start.character}-${location.range.end.line}:${location.range.end.character}`;

  if (location.usageCode) {
    return `  • ${positionInfo}\n    \`\`\`\n${location.usageCode
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n')}\n    \`\`\``;
  }

  return `  • ${positionInfo}`;
}

const DESCRIPTION = `Retrieve comprehensive LSP information for a symbol, including type definitions, documentation, and usage details.
     Essential for fixing type errors and understanding symbol declarations.
     Typical use cases:
     - Fix TypeScript type checking errors
     - Extract function parameters and return types from symbols when encapsulating code blocks into functions
     - Obtain variable types from nearby code symbols when declaring variables or type assertions, avoiding the use of 'any'
     `;

export const getSymbolLspInfoTool: ToolDefinition<typeof GetSymbolLSPInfoInputSchema> = {
  name: 'get_symbol_lsp_info',
  cliName: 'get-symbol-lsp-info',
  title: 'Get Symbol LSP Info',
  description: DESCRIPTION,
  schema: GetSymbolLSPInfoInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  async handler(params, { workspacePath }) {
    const { filePath, symbol, codeSnippet, infoType } = params;
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('getSymbolLSPInfo', { filePath, symbol, codeSnippet, infoType });

    if (result.multipleOccurrences && result.multipleOccurrences.length > 0) {
      let disambig = `⚠️ **Multiple occurrences of \`${symbol}\` found** (${result.multipleOccurrences.length} matches)\n\n`;
      disambig += `📍 **File**: ${filePath}\n\n`;
      disambig += `Use the \`codeSnippet\` parameter with a unique code fragment from the correct occurrence to disambiguate.\n\n`;
      disambig += `**Occurrences:**\n`;
      result.multipleOccurrences.forEach((match, index) => {
        const lineNum = match.line + 1;
        disambig += `\n  **${index + 1}.** Line ${lineNum}:\n`;
        disambig += `    \`${match.lineContent.trim()}\`\n`;
      });
      return disambig;
    }

    let output = `🔍 **Symbol LSP Information: \`${symbol}\`**\n\n`;
    output += `📍 **File**: ${filePath}\n`;
    if (codeSnippet) {
      output += `📝 **Context**: \`${codeSnippet}\`\n`;
    }
    output += `🎯 **Info Type**: ${infoType || 'all'}\n\n`;

    const sections: string[] = [];

    if (result.hover && result.hover.length > 0) {
      sections.push(`**💡 Hover Information** (${result.hover.length} entries):`);
      result.hover.forEach((hover, index) => {
        sections.push(`  **${index + 1}.** ${Array.isArray(hover.contents) ? hover.contents.join('\n') : hover.contents}`);
        if (hover.range) {
          sections.push(
            `     Range: ${hover.range.start.line}:${hover.range.start.character}-${hover.range.end.line}:${hover.range.end.character}`,
          );
        }
      });
    } else if (result.hover) {
      sections.push(`**💡 Hover Information**: No hover info available`);
    }

    if (result.signature_help) {
      sections.push(
        `**✍️ Signature Help**:`,
        `  Active Signature: ${result.signature_help.activeSignature ?? 'N/A'}`,
        `  Active Parameter: ${result.signature_help.activeParameter ?? 'N/A'}`,
        `  Signatures (${result.signature_help.signatures.length}):`,
      );
      result.signature_help.signatures.forEach((sig, index) => {
        sections.push(`    ${index + 1}. \`${sig.label}\``);
        if (sig.documentation) {
          sections.push(`       ${sig.documentation}`);
        }
        if (sig.parameters && sig.parameters.length > 0) {
          sections.push(`       Parameters: ${sig.parameters.map((p) => p.label).join(', ')}`);
        }
      });
    } else if (result.signature_help === null && (infoType === 'signature_help' || infoType === 'all')) {
      sections.push(`**✍️ Signature Help**: No signature help available`);
    }

    if (result.type_definition && result.type_definition.length > 0) {
      sections.push(
        `**🏷️ Type Definition** (${result.type_definition.length} locations):\n${result.type_definition
          .map((def) => formatLocationInfo(def))
          .join('\n')}`,
      );
    } else if (result.type_definition) {
      sections.push(`**🏷️ Type Definition**: No type definitions found`);
    }

    if (result.definition && result.definition.length > 0) {
      sections.push(
        `**📋 Definition** (${result.definition.length} locations):\n${result.definition
          .map((def) => formatLocationInfo(def))
          .join('\n')}`,
      );
    } else if (result.definition) {
      sections.push(`**📋 Definition**: No definitions found`);
    }

    if (result.implementation && result.implementation.length > 0) {
      sections.push(
        `**⚙️ Implementation** (${result.implementation.length} locations):\n${result.implementation
          .map((impl) => formatLocationInfo(impl))
          .join('\n')}`,
      );
    } else if (result.implementation) {
      sections.push(`**⚙️ Implementation**: No implementations found`);
    }

    if (sections.length === 0) {
      output += `❌ No LSP information available for symbol "\`${symbol}\`"`;
      output += `\n\n💡 **Troubleshooting Tips:**`;
      output += `\n- Make sure the symbol name is spelled correctly`;
      output += `\n- Try providing a codeSnippet if there are multiple symbols with the same name`;
      output += `\n- Verify the file URI is correct and the file exists`;
      output += `\n- Ensure the language server extension is installed and running`;
    } else {
      output += sections.join('\n\n');
    }

    return output;
  },
};
