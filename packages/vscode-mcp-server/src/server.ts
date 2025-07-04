import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { EventDispatcher } from "@vscode-mcp/vscode-mcp-ipc";
import { createDispatcher } from "@vscode-mcp/vscode-mcp-ipc";

/**
 * VSCode MCP Server class that handles tool calls and communicates with VSCode extensions
 */
export class VSCodeMCPServer {
  private dispatchers: Map<string, EventDispatcher> = new Map();

  /**
   * Get or create a dispatcher for a specific workspace
   */
  private getDispatcher(workspacePath: string): EventDispatcher {
    if (!this.dispatchers.has(workspacePath)) {
      this.dispatchers.set(workspacePath, createDispatcher(workspacePath));
    }
    return this.dispatchers.get(workspacePath)!;
  }

  /**
   * Get all available tools
   */
  getTools(): Tool[] {
    return [
      {
        name: "health_check",
        description: "Check if VSCode extension is running and healthy",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to check"
            }
          },
          required: ["workspace_path"]
        }
      },
      {
        name: "get_diagnostics",
        description: "Get diagnostic information (errors, warnings, hints) for a file",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            },
            uri: {
              type: "string",
              description: "File URI to get diagnostics for"
            }
          },
          required: ["workspace_path", "uri"]
        }
      },
      {
        name: "get_definition",
        description: "Get definition locations for a symbol at a specific position",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            },
            uri: {
              type: "string",
              description: "File URI"
            },
            line: {
              type: "number",
              description: "Line number (0-based)"
            },
            character: {
              type: "number",
              description: "Character position (0-based)"
            }
          },
          required: ["workspace_path", "uri", "line", "character"]
        }
      },
      {
        name: "get_references",
        description: "Get reference locations for a symbol at a specific position",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            },
            uri: {
              type: "string",
              description: "File URI"
            },
            line: {
              type: "number",
              description: "Line number (0-based)"
            },
            character: {
              type: "number",
              description: "Character position (0-based)"
            },
            include_declaration: {
              type: "boolean",
              description: "Whether to include the declaration in the results",
              default: true
            }
          },
          required: ["workspace_path", "uri", "line", "character"]
        }
      },
      {
        name: "get_hover",
        description: "Get hover information for a symbol at a specific position",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            },
            uri: {
              type: "string",
              description: "File URI"
            },
            line: {
              type: "number",
              description: "Line number (0-based)"
            },
            character: {
              type: "number",
              description: "Character position (0-based)"
            }
          },
          required: ["workspace_path", "uri", "line", "character"]
        }
      },
      {
        name: "get_signature_help",
        description: "Get signature help for a function call at a specific position",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            },
            uri: {
              type: "string",
              description: "File URI"
            },
            line: {
              type: "number",
              description: "Line number (0-based)"
            },
            character: {
              type: "number",
              description: "Character position (0-based)"
            }
          },
          required: ["workspace_path", "uri", "line", "character"]
        }
      },
      {
        name: "get_workspace_info",
        description: "Get workspace information including folders and settings",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            }
          },
          required: ["workspace_path"]
        }
      },
      {
        name: "get_workspace_symbols",
        description: "Search for symbols in the workspace",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            },
            query: {
              type: "string",
              description: "Search query for symbols"
            }
          },
          required: ["workspace_path", "query"]
        }
      },
      {
        name: "execute_command",
        description: "Execute a VSCode command",
        inputSchema: {
          type: "object",
          properties: {
            workspace_path: {
              type: "string",
              description: "VSCode workspace path to target"
            },
            command: {
              type: "string",
              description: "VSCode command to execute (e.g., 'vscode.open', 'editor.action.formatDocument')"
            },
            args: {
              type: "array",
              description: "Optional arguments to pass to the command",
              items: {
                description: "JSON-serializable value"
              }
            }
          },
          required: ["workspace_path", "command"]
        }
      }
    ];
  }

  /**
   * Call a tool with the given arguments
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const { workspace_path, ...params } = args;
    
    if (!workspace_path) {
      throw new Error("workspace_path is required for all tools");
    }

    const dispatcher = this.getDispatcher(workspace_path);

    try {
      switch (name) {
        case "health_check":
          return await dispatcher.dispatch("health", {});

        case "get_diagnostics":
          if (!params.uri) {
            throw new Error("uri is required for get_diagnostics");
          }
          return await dispatcher.dispatch("getDiagnostics", {
            uri: params.uri
          });

        case "get_definition":
          if (!params.uri || typeof params.line !== "number" || typeof params.character !== "number") {
            throw new Error("uri, line, and character are required for get_definition");
          }
          return await dispatcher.dispatch("getDefinition", {
            uri: params.uri,
            line: params.line,
            character: params.character
          });

        case "get_references":
          if (!params.uri || typeof params.line !== "number" || typeof params.character !== "number") {
            throw new Error("uri, line, and character are required for get_references");
          }
          return await dispatcher.dispatch("getReferences", {
            uri: params.uri,
            line: params.line,
            character: params.character,
            includeDeclaration: params.include_declaration
          });

        case "get_hover":
          if (!params.uri || typeof params.line !== "number" || typeof params.character !== "number") {
            throw new Error("uri, line, and character are required for get_hover");
          }
          return await dispatcher.dispatch("getHover", {
            uri: params.uri,
            line: params.line,
            character: params.character
          });

        case "get_signature_help":
          if (!params.uri || typeof params.line !== "number" || typeof params.character !== "number") {
            throw new Error("uri, line, and character are required for get_signature_help");
          }
          return await dispatcher.dispatch("getSignatureHelp", {
            uri: params.uri,
            line: params.line,
            character: params.character
          });

        case "get_workspace_info":
          return await dispatcher.dispatch("getWorkspaceInfo", {});

        case "get_workspace_symbols":
          if (!params.query) {
            throw new Error("query is required for get_workspace_symbols");
          }
          return await dispatcher.dispatch("getWorkspaceSymbols", {
            query: params.query
          });

        case "execute_command":
          if (!params.command) {
            throw new Error("command is required for execute_command");
          }
          return await dispatcher.dispatch("executeCommand", {
            command: params.command,
            args: params.args
          });

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Tool ${name} failed: ${message}`);
    }
  }
} 