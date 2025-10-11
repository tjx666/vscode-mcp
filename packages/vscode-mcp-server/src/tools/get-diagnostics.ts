import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetDiagnosticsInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { VscodeMcpToolName } from "../constants.js";
import { formatToolCallError } from "../utils/format-tool-call-error.js";
import { workspacePathInputSchema } from "../utils/workspace-schema.js";

const inputSchema = {
  ...workspacePathInputSchema,
  ...GetDiagnosticsInputSchema.shape
};

const DESCRIPTION = `Get diagnostic information from vscode language servers.

Ideal quality-check tool for AI coding agents, much faster than 'tsc --noEmit' and 'eslint .'

**Parameter Examples:**
- Check modified files: filePaths: [] (auto-detects git changes)
- Filter ESLint errors only: sources: ['eslint'], severities: ['error']

**Return Format:**
Structured diagnostic results with severity levels, positions, and detailed error messages.
Severity levels: 0=ERROR, 1=WARNING, 2=INFO, 3=HINT (matches VSCode DiagnosticSeverity enum)

**Note:**
  - In most cases, leave filePaths parameter empty to auto-detect git modified files. Modifying one file often causes diagnostics in other related files.

`;

export function registerGetDiagnostics(server: McpServer) {
  server.registerTool(VscodeMcpToolName.GET_DIAGNOSTICS, {
    title: "Get Diagnostics",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get Diagnostics",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, filePaths, sources, severities }) => {
    const dispatcher = await createDispatcher(workspace_path);

    try {
      const result = await dispatcher.dispatch("getDiagnostics", { filePaths, sources, severities });
      
      // Handle case where no files were found
      if (result.files.length === 0) {
        return {
          content: [{
            type: "text",
            text: filePaths.length === 0 
              ? "📄 No git modified files found in the workspace."
              : "📄 No files found or no diagnostics available."
          }]
        };
      }
      
      // Filter out files with no diagnostics and format output
      const filesWithDiagnostics = result.files.filter(file => file.diagnostics.length > 0);
      
      const output = filesWithDiagnostics.map(file => {
        const diagnosticsList = file.diagnostics.map(diag => {
          const severity = diag.severity.toUpperCase();
          const range = `${diag.range.start.line}:${diag.range.start.character}`;
          const source = diag.source ? `[${diag.source}] ` : "";
          const code = diag.code ? `(${diag.code}) ` : "";
          
          return `   ${severity} at ${range}: ${source}${code}${diag.message}`;
        }).join('\n');
        
        return `❌ ${file.uri}\n   Found ${file.diagnostics.length} diagnostic(s):\n${diagnosticsList}`;
      }).join('\n\n');
      
      // Create summary based on diagnostic results
      let summary: string;
      
      if (filesWithDiagnostics.length === 0) {
        summary = filePaths.length === 0 
          ? `✅ All git modified files (${result.files.length} files) are clean - no diagnostics found!`
          : `✅ All checked files are clean - no diagnostics found!`;
      } else {
        const header = filePaths.length === 0
          ? `⚠️ Found diagnostics in ${filesWithDiagnostics.length} of ${result.files.length} git modified files:`
          : `⚠️ Found diagnostics in ${filesWithDiagnostics.length} file(s):`;
        
        summary = `${header}\n\n${output}`;
      }
      
      return {
        content: [{
          type: "text",
          text: summary
        }]
      };
    } catch (error) {
      return formatToolCallError("Get Diagnostics", error);
    }
  });
} 