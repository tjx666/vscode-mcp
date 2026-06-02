#!/usr/bin/env node

import type { AnyToolDefinition } from '@vscode-mcp/vscode-mcp-core';
import { getAllTools } from '@vscode-mcp/vscode-mcp-core';
import { Command } from 'commander';

import packageJson from '../package.json' with { type: 'json' };
import type { OptionSpec } from './zod-to-options.js';
import { schemaToOptions } from './zod-to-options.js';

const PACKAGE_NAME = Object.keys(packageJson.bin)[0];
const PACKAGE_VERSION = packageJson.version;

function applyOption(cmd: Command, spec: OptionSpec | { flags: string; description: string; defaultValue?: unknown; parse?: (v: string, prev?: unknown) => unknown }): void {
  const { flags, description, defaultValue, parse } = spec;
  if (parse) {
    cmd.option(flags, description, parse as any, defaultValue);
  } else if (defaultValue !== undefined) {
    cmd.option(flags, description, defaultValue as any);
  } else {
    cmd.option(flags, description);
  }
}

function registerTool(program: Command, tool: AnyToolDefinition): void {
  const cmd = program.command(tool.cliName).description(tool.description);

  if (tool.requiresWorkspace) {
    cmd.option('-w, --workspace <path>', 'VSCode workspace path (defaults to current directory)');
  }

  let autoSpecs: OptionSpec[] = [];
  if (tool.cli?.options) {
    for (const o of tool.cli.options) {
      applyOption(cmd, o);
    }
  } else {
    autoSpecs = schemaToOptions(tool.schema);
    for (const o of autoSpecs) {
      applyOption(cmd, o);
    }
  }

  cmd.action(async (cliOpts: Record<string, unknown>) => {
    try {
      const workspacePath = tool.requiresWorkspace
        ? ((cliOpts.workspace as string | undefined) ?? process.cwd())
        : '';

      let params: unknown;
      if (tool.cli?.transform) {
        params = tool.cli.transform(cliOpts);
      } else {
        // Rebuild the params object using each spec's original zod key, so
        // schema keys like `__NOT_RECOMMEND__filePaths` map back correctly
        // from their kebab-cased flag.
        const rebuilt: Record<string, unknown> = {};
        for (const spec of autoSpecs) {
          if (cliOpts[spec.optName] !== undefined) {
            rebuilt[spec.key] = cliOpts[spec.optName];
          }
        }
        params = rebuilt;
      }

      const validated = tool.schema.parse(params);
      const text = await tool.handler(validated, { workspacePath });
      console.log(text);
    } catch (error) {
      console.error(
        `❌ ${tool.title} failed: ${String(error)}${tool.errorTips ? `\n\n${tool.errorTips}` : ''}`,
      );
      process.exit(1);
    }
  });
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name(PACKAGE_NAME)
    .description(
      'Call VSCode MCP Bridge capabilities from the command line — no MCP client required.\n' +
        'Requires the "VSCode MCP Bridge" extension running in a VSCode instance.',
    )
    .version(PACKAGE_VERSION);

  for (const tool of getAllTools({ clientVersion: PACKAGE_VERSION })) {
    registerTool(program, tool);
  }

  await program.parseAsync();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
