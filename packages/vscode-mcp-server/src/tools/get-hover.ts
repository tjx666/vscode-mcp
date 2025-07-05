import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetHoverInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetHoverInputSchema.shape
};

export function registerGetHovers(server: McpServer) {
  server.registerTool("get_hovers", {
    title: "Get Hover Information",
    description: "Get hover information for multiple positions in code files. Supports getting all hover providers' information or just the first one.",
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
          output += `   No hover information available\n\n`;
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