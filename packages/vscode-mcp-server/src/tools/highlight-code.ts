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
- When user asks "find the authentication logic", open the file and highlight the relevant functions
- When explaining how a feature works, show the exact code sections visually
- ALWAYS prefer this over just telling users "check lines 10-15 in utils.ts" - visual highlighting is much better

**Parameter Examples:**
- Show auth logic: uri: 'file:///utils/auth.ts', ranges: [{ startLine: 25, endLine: 45, message: 'User authentication function', type: 'info' }]
- Custom colors: ranges: [{ startLine: 10, endLine: 15, backgroundColor: '#ff0000', foregroundColor: '#ffffff', message: 'Critical section' }]
- Mixed highlighting: ranges: [{ startLine: 5, endLine: 8, type: 'warning' }, { startLine: 20, endLine: 25, backgroundColor: 'rgba(255,0,0,0.3)' }]

**Return Format:**
Success status with highlight count and file opening confirmation

**Important Notes:**
- Line and character numbers are zero-based
- Different types (info, warning, error, success) have different colors by default
- Custom backgroundColor and foregroundColor override type-based colors
- Files are automatically opened and brought to focus (showEditor: true by default)
- Previous highlights are cleared by default to avoid clutter
- Highlights automatically clear after 1.5 seconds by default (set timeout: 0 for permanent)`;

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
          const typeIcon = {
            info: '🔵',
            warning: '🟡', 
            error: '🔴',
            success: '🟢'
          }[range.type || 'info'];
          
          responseText += `${index + 1}. ${typeIcon} Lines ${range.startLine + 1}-${range.endLine + 1}`;
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