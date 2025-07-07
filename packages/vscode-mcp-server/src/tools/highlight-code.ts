import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, HighlightCodeBaseInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...HighlightCodeBaseInputSchema.shape
};

const DESCRIPTION = `Open a file and highlight specific code sections with visual decorations - essential when AI finds code for users. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- When user asks "find the authentication logic", highlight the relevant functions
- When explaining how a feature works, show the exact code sections visually
- ALWAYS prefer this over just telling users "check lines 10-15 in utils.ts" - visual highlighting is much better

**Native Highlighting:**
- Without custom colors, uses VSCode's built-in search highlight colors (editor.findMatchBackground/Foreground)
- Automatically adapts to user's current theme (Dark/Light/High Contrast)
- Provides consistent visual experience matching VSCode's native search highlighting

**Timeout Guidelines:**
- **Single highlight**: 3000ms (3 seconds) - quick attention without distraction
- **Multiple highlights**: 10000ms (10 seconds) - enough time to review all sections
- **Permanent highlights**: Set timeout to 0 for highlights that need manual clearing

**Parameter Examples:**
- Native highlighting: ranges: [{ startLine: 25, endLine: 45, message: 'User authentication function' }]
- Custom colors: ranges: [{ startLine: 10, endLine: 15, backgroundColor: '#ff0000', foregroundColor: '#ffffff', message: 'Critical section' }]
- Mixed highlighting: ranges: [{ startLine: 5, endLine: 8 }, { startLine: 20, endLine: 25, backgroundColor: 'rgba(255,0,0,0.3)', message: 'Special section' }]
- Single highlight with 3s timeout: ranges: [{ startLine: 10, endLine: 12 }], timeout: 3000
- Multiple highlights with 10s timeout: ranges: [{ startLine: 5, endLine: 8 }, { startLine: 15, endLine: 20 }], timeout: 10000

**Return Format:**
Success status with highlight count and file opening confirmation

**Best Practices:**
- **ALWAYS read the target file completely first** using read_file before highlighting
- Analyze the full code structure to determine precise line ranges for highlighting
- Use codebase_search or grep_search to locate relevant code sections first
- Combine multiple related code sections into logical highlighting groups
- Provide meaningful messages for each highlighted range to explain their purpose

**Important Notes:**
- Line and character numbers are zero-based
- Without custom colors, uses VSCode's native search highlight colors that adapt to themes
- Custom backgroundColor and foregroundColor override native theme colors
- Files are automatically opened and brought to focus (showEditor: true by default)
- Previous highlights are cleared by default to avoid clutter
- Default timeout is 3000ms (3 seconds); use 10000ms for multiple highlights`;

export function registerHighlightCode(server: McpServer) {
  server.registerTool("highlight_code", {
    title: "Highlight Code",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Highlight Code",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, uri, ranges, showEditor, scrollToFirst, clearPrevious, timeout }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("highlightCode", { 
        uri, 
        ranges, 
        showEditor, 
        scrollToFirst, 
        clearPrevious, 
        timeout 
      });
      
      if (result.success) {
        let responseText = `✅ **Code Highlighted Successfully**\n\n`;
        responseText += `📊 **Summary**: ${result.highlightCount} range(s) highlighted`;
        
        if (result.clearedCount && result.clearedCount > 0) {
          responseText += `, ${result.clearedCount} previous highlight(s) cleared`;
        }
        
        responseText += `\n\n📄 **File**: ${uri}`;
        
        // Add range details
        responseText += `\n\n🎯 **Highlighted Ranges**:\n`;
        ranges.forEach((range, index) => {
          const hasCustomColors = range.backgroundColor || range.foregroundColor;
          const icon = hasCustomColors ? '🎨' : '🔍'; // Custom colors vs native highlighting
          
          responseText += `${index + 1}. ${icon} Lines ${range.startLine + 1}-${range.endLine + 1}`;
          if (range.message) {
            responseText += `: ${range.message}`;
          }
          responseText += `\n`;
        });
        
        if (timeout && timeout > 0) {
          responseText += `\n⏰ **Auto-clear**: Highlights will be removed after ${timeout}ms`;
        } else if (timeout === 0) {
          responseText += `\n📌 **Permanent**: Highlights will remain until manually cleared`;
        }
        
        return {
          content: [{
            type: "text",
            text: responseText
          }]
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `❌ **Highlight Failed**: ${result.message || 'Unknown error'}`
          }]
        };
      }
    } catch (error) {
      return formatToolCallError("Highlight Code", error);
    }
  });
} 