#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import packageJson from "../package.json" with { type: "json" };
import { getAllToolNames } from "./constants.js";
import { createVSCodeMCPServer } from "./server.js";

// Package info from package.json
const PACKAGE_NAME = Object.keys(packageJson.bin)[0]; // Get the command name from bin field
const PACKAGE_VERSION = packageJson.version;


/**
 * Parse disabled tools from CLI arguments or environment variables
 */
function parseDisabledTools(args: string[]): string[] {
  const disabledTools = new Set<string>();

  // Check environment variable first
  const envDisabled = process.env.VSCODE_MCP_DISABLED_TOOLS;
  if (envDisabled) {
    envDisabled.split(',').forEach(tool => {
      const trimmed = tool.trim();
      if (trimmed) disabledTools.add(trimmed);
    });
  }

  // Check CLI arguments (overrides environment variable)
  const disableToolsIndex = args.indexOf('--disable-tools');
  if (disableToolsIndex !== -1 && disableToolsIndex + 1 < args.length) {
    const toolsArg = args[disableToolsIndex + 1];
    toolsArg.split(',').forEach(tool => {
      const trimmed = tool.trim();
      if (trimmed) disabledTools.add(trimmed);
    });
  }

  const availableTools = getAllToolNames();

  // Validate tool names
  const invalidTools = [...disabledTools].filter(tool => !availableTools.includes(tool));
  if (invalidTools.length > 0) {
    console.error(`Warning: Invalid tool names will be ignored: ${invalidTools.join(', ')}`);
    console.error(`Available tools: ${availableTools.join(', ')}`);
  }

  // Return only valid tools
  return [...disabledTools].filter(tool => availableTools.includes(tool));
}

/**
 * Handle command line arguments
 */
function handleCliArgs(): { shouldExit: boolean; disabledTools: string[] } {
  const args = process.argv.slice(2);
  const argSet = new Set(args);

  const disabledTools = parseDisabledTools(args);
  
  if (argSet.has("--version") || argSet.has("-v")) {
    console.log(`${PACKAGE_NAME} v${PACKAGE_VERSION}`);
    return { shouldExit: true, disabledTools: [] };
  }

  if (argSet.has("--help") || argSet.has("-h")) {
    console.log(`
${PACKAGE_NAME} v${PACKAGE_VERSION}

A Model Context Protocol (MCP) server that provides access to VSCode workspace information.

Usage:
  ${PACKAGE_NAME} [options]

Options:
  -v, --version        Show version information
  -h, --help           Show this help message
  --disable-tools      Comma-separated list of tools to disable

Description:
  This server communicates with VSCode extensions through Unix Domain Sockets
  to provide real-time code intelligence information to MCP clients.

  The server expects stdin/stdout communication using the MCP protocol.
  It requires the VSCode MCP Bridge extension to be installed and running.

Available Tools:
  ${getAllToolNames().join(', ')}

Examples:
  # Start the server (for MCP client usage)
  ${PACKAGE_NAME}

  # Disable specific tools
  ${PACKAGE_NAME} --disable-tools execute_command,list_workspaces

  # Using environment variable
  VSCODE_MCP_DISABLED_TOOLS="execute_command,list_workspaces" ${PACKAGE_NAME}

  # Show version
  ${PACKAGE_NAME} --version
`);
    return { shouldExit: true, disabledTools: [] };
  }

  return { shouldExit: false, disabledTools };
}

/**
 * Main entry point for the MCP server
 */
async function main(): Promise<void> {
  // Handle CLI arguments first
  const { shouldExit, disabledTools } = handleCliArgs();
  if (shouldExit) {
    return;
  }

  // Log disabled tools if any
  if (disabledTools.length > 0) {
    console.error(`Disabled tools: ${disabledTools.join(', ')}`);
  }

  // Create the server using the new architecture
  const server = createVSCodeMCPServer(PACKAGE_NAME, PACKAGE_VERSION, disabledTools);

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