import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetHoverInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetHoverInputSchema.shape
};

const DESCRIPTION = `Get rich type information, documentation, and value details for multiple code positions - essential for type-aware AI coding. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Understand complex types and read inline documentation for functions, variables, and classes
- Batch analyze multiple symbols for comprehensive code understanding  
- ALWAYS prefer this over codebase_search, grep_search, file_search when you already know the exact code positions

**Parameter Examples:**
- Get type info: positions: [{ uri: 'file:///app.ts', line: 25, character: 8 }]
- Batch analysis: positions: [{ uri: 'file:///utils.js', line: 10, character: 5 }, { uri: 'file:///api.ts', line: 15, character: 12 }]
- Comprehensive info: includeAllHovers: true

**Return Format:**
Detailed hover information with types, documentation, and value details

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- No need to position cursor at target location - just provide position parameters
- Line and character numbers are zero-based
- includeAllHovers: true provides comprehensive info but may be slower
- Returns empty hovers array if no information available at position
- Hover contents may include markdown formatting`;

export function registerGetHovers(server: McpServer) {
  server.registerTool("get_hovers", {
    title: "Get Hover Information",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get Hover Information",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, positions, includeAllHovers }) => {
    const dispatcher = createDispatcher(workspace_path);
    
    try {
      const result = await dispatcher.dispatch("getHover", { positions, includeAllHovers });
      
      // Format output with status icons and structured display
      const successCount = result.results.filter(r => !r.error).length;
      const errorCount = result.results.filter(r => r.error).length;
      const totalHovers = result.results.reduce((sum, r) => sum + r.hovers.length, 0);
      
      let output = `🔍 **Hover Information Results**\n\n`;
      output += `📊 **Summary**: ${successCount} successful, ${errorCount} errors, ${totalHovers} total hovers\n\n`;
      
      // Display results for each position
      result.results.forEach((posResult, index) => {
        const { position, hovers, error } = posResult;
        const positionStr = `${position.uri}:${position.line}:${position.character}`;
        
        if (error) {
          output += `❌ **Position ${index + 1}**: ${positionStr}\n`;
          output += `   Error: ${error}\n\n`;
        } else if (hovers.length === 0) {
          output += `⚪ **Position ${index + 1}**: ${positionStr}\n`;
          output += `   No hover information available\n`;
          output += `   💡 **Tip:** Line and character numbers are **0-based** (first line is 0, first character is 0)\n`;
          output += `   💡 **Tip:** Make sure the position(line, col) is exactly on a symbol\n\n`;
        } else {
          output += `✅ **Position ${index + 1}**: ${positionStr}\n`;
          output += `   Found ${hovers.length} hover(s)${includeAllHovers ? ' (all providers)' : ' (first provider only)'}\n\n`;
          
          hovers.forEach((hover, hoverIndex) => {
            output += `   **Hover ${hoverIndex + 1}**:\n`;
            if (hover.range) {
              output += `   Range: ${hover.range.start.line}:${hover.range.start.character} - ${hover.range.end.line}:${hover.range.end.character}\n`;
            }
            output += `   Contents:\n`;
            const contents = Array.isArray(hover.contents) ? hover.contents : [hover.contents];
            contents.forEach((content, contentIndex) => {
              output += `   ${contentIndex + 1}. ${content}\n`;
            });
            output += `\n`;
          });
        }
      });
      
      return {
        content: [{
          type: "text",
          text: output
        }]
      };
    } catch (error) {
      return formatToolCallError("Get Hover Information", error);
    }
  });
}