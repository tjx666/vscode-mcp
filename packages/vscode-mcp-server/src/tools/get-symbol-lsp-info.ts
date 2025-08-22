import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetSymbolLSPInfoInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

/**
 * Format location info with optional code content
 */
function formatLocationInfo(location: { uri: string; range: { start: { line: number; character: number }; end: { line: number; character: number } }; usageCode?: string }): string {
  const positionInfo = `${location.uri} @ ${location.range.start.line}:${location.range.start.character}-${location.range.end.line}:${location.range.end.character}`;
  
  if (location.usageCode) {
    return `  • ${positionInfo}\n    \`\`\`\n${location.usageCode.split('\n').map(line => `    ${line}`).join('\n')}\n    \`\`\``;
  }
  
  return `  • ${positionInfo}`;
}

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetSymbolLSPInfoInputSchema.shape
};

const DESCRIPTION = `Get comprehensive LSP information for a symbol

**Parameter Examples:**
- Get all info: uri: 'file:///app.ts', symbol: 'getUserData', codeSnippet: 'async function getUserData('
- Specific types: uri: 'file:///utils.js', symbol: 'processData', infoType: 'definition'
- Interface analysis: uri: 'file:///types.ts', symbol: 'UserModel', infoType: 'type_definition'

**Info Types Available:**
- **all**(default): Returns all available information
- **hover**: Rich type information and documentation
- **signature_help**: Function parameters and overloads
- **type_definition**: Where the symbol's type is defined
- **definition**: Where the symbol is defined
- **implementation**: All implementations of interfaces/abstract classes

**Return Format:**
Structured object containing requested LSP information:
- Each info type returns an array or object with relevant details
- Location-based results include file paths and precise coordinates
- Hover results include formatted documentation and type info
- Signature help includes parameter details and active signature
`;

export function registerGetSymbolLSPInfo(server: McpServer) {
  server.registerTool("get_symbol_lsp_info", {
    title: "Get Symbol LSP Info",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get Symbol LSP Info",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, uri, symbol, codeSnippet, infoType }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getSymbolLSPInfo", { uri, symbol, codeSnippet, infoType });
      
      // Format the comprehensive results
      let output = `🔍 **Symbol LSP Information: \`${symbol}\`**\n\n`;
      output += `📍 **File**: ${uri}\n`;
      if (codeSnippet) {
        output += `📝 **Context**: \`${codeSnippet}\`\n`;
      }
      output += `🎯 **Info Type**: ${infoType || 'all'}\n\n`;
      
      const sections: string[] = [];
      
      // Hover results
      if (result.hover && result.hover.length > 0) {
        sections.push(`**💡 Hover Information** (${result.hover.length} entries):`);
        result.hover.forEach((hover, index) => {
          sections.push(`  **${index + 1}.** ${Array.isArray(hover.contents) ? hover.contents.join('\n') : hover.contents}`);
          if (hover.range) {
            sections.push(`     Range: ${hover.range.start.line}:${hover.range.start.character}-${hover.range.end.line}:${hover.range.end.character}`);
          }
        });
      } else if (result.hover) {
        sections.push(`**💡 Hover Information**: No hover info available`);
      }
      
      // Signature Help results
      if (result.signature_help) {
        sections.push(`**✍️ Signature Help**:`);
        sections.push(`  Active Signature: ${result.signature_help.activeSignature ?? 'N/A'}`);
        sections.push(`  Active Parameter: ${result.signature_help.activeParameter ?? 'N/A'}`);
        sections.push(`  Signatures (${result.signature_help.signatures.length}):`);
        result.signature_help.signatures.forEach((sig, index) => {
          sections.push(`    ${index + 1}. \`${sig.label}\``);
          if (sig.documentation) {
            sections.push(`       ${sig.documentation}`);
          }
          if (sig.parameters && sig.parameters.length > 0) {
            sections.push(`       Parameters: ${sig.parameters.map(p => p.label).join(', ')}`);
          }
        });
      } else if (result.signature_help === null && (infoType === 'signature_help' || infoType === 'all')) {
        sections.push(`**✍️ Signature Help**: No signature help available`);
      }
      
      // Type Definition results
      if (result.type_definition && result.type_definition.length > 0) {
        sections.push(`**🏷️ Type Definition** (${result.type_definition.length} locations):\n${result.type_definition.map(def => 
            formatLocationInfo(def)
          ).join('\n')}`);
      } else if (result.type_definition) {
        sections.push(`**🏷️ Type Definition**: No type definitions found`);
      }
      
      // Definition results
      if (result.definition && result.definition.length > 0) {
        sections.push(`**📋 Definition** (${result.definition.length} locations):\n${result.definition.map(def => 
            formatLocationInfo(def)
          ).join('\n')}`);
      } else if (result.definition) {
        sections.push(`**📋 Definition**: No definitions found`);
      }
      
      // Implementation results
      if (result.implementation && result.implementation.length > 0) {
        sections.push(`**⚙️ Implementation** (${result.implementation.length} locations):\n${result.implementation.map(impl => 
            formatLocationInfo(impl)
          ).join('\n')}`);
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
      
      return {
        content: [{
          type: "text" as const,
          text: output
        }]
      };
    } catch (error) {
      return formatToolCallError("Get Symbol LSP Info", error);
    }
  });
}