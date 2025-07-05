import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetDiagnosticsInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetDiagnosticsInputSchema.shape
};

const DESCRIPTION = `Get real-time diagnostic information (errors, warnings, hints) from VSCode's language servers - the efficient alternative to running tsc/eslint commands.

**AI Coding Agent Use Cases:**
- Quickly validate code changes without running slow tsc --noEmit or eslint commands
- Get instant feedback on syntax errors and type issues during code generation
- Verify large-scale refactoring impacts without full project rebuilds
- Smart Git integration: automatically check all modified files for issues

**Parameter Examples:**
- Check modified files: uris: [] (auto-detects git changes, much faster than npm run build)
- Validate specific files: uris: ['file:///src/app.ts', 'file:///src/utils.js']
- Single file verification: uris: ['file:///components/Button.tsx']

**Return Format:**
Structured diagnostic results with severity levels, positions, and detailed error messages

**AI Coding Agent Benefits:**
- Replaces slow tsc --noEmit with instant LSP diagnostics
- Avoids expensive eslint . runs on large codebases
- Provides real-time feedback during iterative code generation
- Git integration automatically finds files that need checking

**Important Notes:**
- Files are automatically opened to ensure accurate LSP diagnostics
- Empty uris array triggers Git integration to find all modified files
- Severity levels: 1=ERROR, 2=WARNING, 3=INFO, 4=HINT
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
          const severityMap: Record<number, string> = { 1: "ERROR", 2: "WARNING", 3: "INFO", 4: "HINT" };
          const severity = severityMap[diag.severity || 1] || "ERROR";
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