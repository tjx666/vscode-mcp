#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";

import { VSCodeMCPServer } from "./server.js";

// Package info
const PACKAGE_NAME = "vscode-mcp-server";
const PACKAGE_VERSION = "1.0.0";

/**
 * Handle command line arguments
 */
function handleCliArgs(): boolean {
  const args = new Set(process.argv.slice(2));
  
  if (args.has("--version") || args.has("-v")) {
    console.log(`${PACKAGE_NAME} v${PACKAGE_VERSION}`);
    return true;
  }
  
  if (args.has("--help") || args.has("-h")) {
    console.log(`
${PACKAGE_NAME} v${PACKAGE_VERSION}

A Model Context Protocol (MCP) server that provides access to VSCode workspace information.

Usage:
  ${PACKAGE_NAME} [options]

Options:
  -v, --version     Show version information
  -h, --help        Show this help message

Description:
  This server communicates with VSCode extensions through Unix Domain Sockets
  to provide real-time code intelligence information to MCP clients.

  The server expects stdin/stdout communication using the MCP protocol.
  It requires the VSCode MCP Bridge extension to be installed and running.

Examples:
  # Start the server (for MCP client usage)
  ${PACKAGE_NAME}
  
  # Show version
  ${PACKAGE_NAME} --version
`);
    return true;
  }
  
  return false;
}

/**
 * Main entry point for the MCP server
 */
async function main(): Promise<void> {
  // Handle CLI arguments first
  if (handleCliArgs()) {
    return;
  }

  const server = new Server({
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
  }, {
    capabilities: {
      tools: {},
    },
  });

  // Create VSCode MCP server instance
  const vscodeServer = new VSCodeMCPServer();

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: vscodeServer.getTools(),
    };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      const result = await vscodeServer.callTool(name, args || {});
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new McpError(ErrorCode.InternalError, message);
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("VSCode MCP Server started on stdio");
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 