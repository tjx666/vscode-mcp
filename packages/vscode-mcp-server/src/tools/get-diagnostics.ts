import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetDiagnosticsInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetDiagnosticsInputSchema.shape
};

const DESCRIPTION = `Get real-time diagnostic information (errors, warnings, hints) from language servers - the efficient alternative to running tsc/eslint commands. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Replace slow 'tsc --noEmit' and 'eslint .' commands with instant LSP diagnostics
- Validate code changes immediately after generation without running full builds
- Auto-check all git modified files to catch issues across entire changesets
- Get precise error locations and messages for targeted code fixes
- Monitor code health during iterative AI-assisted development

**Parameter Examples:**
- Check modified files: uris: [] (auto-detects git changes, much faster than npm run build)
- Validate specific files: uris: ['file:///src/app.ts', 'file:///src/utils.js']
- Single file verification: uris: ['file:///components/Button.tsx']

**Return Format:**
Structured diagnostic results with severity levels, positions, and detailed error messages.
Severity levels: 0=ERROR, 1=WARNING, 2=INFO, 3=HINT (matches VSCode DiagnosticSeverity enum)

**Important Notes:**
- Files are automatically opened to ensure accurate LSP diagnostics
- Empty uris array triggers Git integration to find all modified files
- Line and character numbers are zero-based`;

export function registerGetDiagnostics(server: McpServer) {
  server.registerTool("get_diagnostics", {
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
  }, async ({ workspace_path, uris }) => {
    const dispatcher = createDispatcher(workspace_path);
    
    try {
      const result = await dispatcher.dispatch("getDiagnostics", { uris });
      
      // Handle case where no files were found
      if (result.files.length === 0) {
        return {
          content: [{
            type: "text",
            text: uris.length === 0 
              ? "📄 No git modified files found in the workspace."
              : "📄 No files found or no diagnostics available."
          }]
        };
      }
      
      // Format output for better readability
      const output = result.files.map(file => {
        if (file.diagnostics.length === 0) {
          return `✅ ${file.uri}\n   No diagnostics found`;
        }
        
        const diagnosticsList = file.diagnostics.map(diag => {
          const severityMap: Record<number, string> = { 0: "ERROR", 1: "WARNING", 2: "INFO", 3: "HINT" };
          const severity = severityMap[diag.severity ?? 0] || "ERROR";
          const range = `${diag.range.start.line}:${diag.range.start.character}`;
          const source = diag.source ? `[${diag.source}] ` : "";
          const code = diag.code ? `(${diag.code}) ` : "";
          
          return `   ${severity} at ${range}: ${source}${code}${diag.message}`;
        }).join('\n');
        
        return `🔍 ${file.uri}\n   Found ${file.diagnostics.length} diagnostic(s):\n${diagnosticsList}`;
      }).join('\n\n');
      
      const summary = uris.length === 0 
        ? `🔍 Diagnostics for all git modified files (${result.files.length} files):\n\n${output}`
        : output;
      
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