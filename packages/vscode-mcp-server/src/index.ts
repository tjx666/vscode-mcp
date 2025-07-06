#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import packageJson from "../package.json" with { type: "json" };
import { createVSCodeMCPServer } from "./server.js";

// Package info from package.json
const PACKAGE_NAME = Object.keys(packageJson.bin)[0]; // Get the command name from bin field
const PACKAGE_VERSION = packageJson.version;

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

  // Create the server using the new architecture
  const server = createVSCodeMCPServer(PACKAGE_NAME, PACKAGE_VERSION);

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