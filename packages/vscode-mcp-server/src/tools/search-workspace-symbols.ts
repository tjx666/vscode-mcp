import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, SearchWorkspaceSymbolsInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { VscodeMcpToolName } from "../constants.js";
import { formatToolCallError } from "../utils/format-tool-call-error.js";
import { workspacePathInputSchema } from "../utils/workspace-schema.js";

const inputSchema = {
  ...workspacePathInputSchema,
  ...SearchWorkspaceSymbolsInputSchema.shape,
};

const DESCRIPTION = `Search for symbols (classes, functions, variables, interfaces, etc.) across the entire workspace by name or pattern. Supports batch queries to look up multiple symbols in one call.

Results come from all installed language server extensions, so this covers not just your source files but also external dependencies indexed by the language server — for example, the Red Hat Java extension indexes all jar dependencies, allowing you to find classes like ObjectMapper or HttpClient and see which jar they come from.

**Return Format:**
One result entry per query, each containing the matched symbols with name, kind, container name, file URI and range.

**Typical Use Cases:**
- Find where a class/interface/function/variable is defined when you only know its name, without knowing which file it lives in
- Locate the file path and exact line of any symbol across the entire codebase
- Explore all symbols matching a prefix or partial name (e.g. query "User" to find UserService, UserController, UserDto, etc.)
- Find which jar/library a Java class belongs to (e.g. query "ObjectMapper" → URI reveals it's in jackson-databind-x.x.x.jar)
`;


// VSCode SymbolKind enum labels for human-readable output
const SYMBOL_KIND_LABELS: Record<number, string> = {
  0: 'File', 1: 'Module', 2: 'Namespace', 3: 'Package', 4: 'Class',
  5: 'Method', 6: 'Property', 7: 'Field', 8: 'Constructor', 9: 'Enum',
  10: 'Interface', 11: 'Function', 12: 'Variable', 13: 'Constant',
  14: 'String', 15: 'Number', 16: 'Boolean', 17: 'Array', 18: 'Object',
  19: 'Key', 20: 'Null', 21: 'EnumMember', 22: 'Struct', 23: 'Event',
  24: 'Operator', 25: 'TypeParameter',
};

export function registerSearchWorkspaceSymbols(server: McpServer) {
  server.registerTool(VscodeMcpToolName.SEARCH_WORKSPACE_SYMBOLS, {
    title: "Search Workspace Symbols",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Search Workspace Symbols",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, async ({ workspace_path, queries }) => {
    try {
      const dispatcher = await createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("searchWorkspaceSymbols", { queries });

      const sections = result.results.map(({ query, symbols }) => {
        if (symbols.length === 0) {
          return `## "${query}"\nNo symbols found.`;
        }
        const lines = symbols.map(s => {
          const kind = SYMBOL_KIND_LABELS[s.kind] ?? `Kind(${s.kind})`;
          const container = s.containerName ? ` [in ${s.containerName}]` : '';
          return `${kind} ${s.name}${container}\n  ${s.uri} @ ${s.range.start.line}:${s.range.start.character}`;
        });
        return `## "${query}" — ${symbols.length} symbol(s)\n\n${lines.join('\n\n')}`;
      });

      return {
        content: [{
          type: "text" as const,
          text: sections.join('\n\n---\n\n'),
        }],
      };
    } catch (error) {
      return formatToolCallError("Search Workspace Symbols", error);
    }
  });
}
