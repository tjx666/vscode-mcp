import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDispatcher, RequestInputInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

import { formatToolCallError } from './utils.js';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...RequestInputInputSchema.shape,
};

const DESCRIPTION = `Request simple text input from the user through editor input dialog. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Get missing information needed to complete coding tasks (API keys, file paths, URLs)
- Clarify ambiguous requirements or user intentions during development
- Request specific values for configuration files or environment variables
- Ask for error messages or logs when troubleshooting issues
- Collect user preferences for code generation (naming conventions, patterns)
- Get confirmation for potentially destructive operations

**Parameter Examples:**
- Request reason: prompt: "Why did you decline the previous request?", placeholder: "e.g., security concern"
- Command feedback: prompt: "Why did you skip executing 'rm -rf node_modules'?", placeholder: "e.g., want to keep cache, risky command"
- Missing info: prompt: "Please provide the screenshot path:", placeholder: "/path/to/image.png"
- Error info: prompt: "Could you paste the error message?", placeholder: "Paste error here..."
- Config value: prompt: "What's your preferred API endpoint?", placeholder: "https://api.example.com"
- Password: prompt: "Enter your database password:", password: true

**Return Format:**
- userInput: string (user's input text) or undefined if cancelled
- cancelled: boolean (true if user cancelled the dialog)

**Important Notes:**
- Best for simple, single-line text input
- Use password: true for sensitive information
- Always handle cancellation gracefully
- Input validation can be enabled to prevent empty submissions`;

export function registerRequestInput(server: McpServer) {
  server.registerTool(
    'request_input',
    {
      title: 'Request User Input',
      description: DESCRIPTION,
      inputSchema,
      annotations: {
        title: 'Request User Input',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ workspace_path, prompt, placeholder, title, password, validateInput }) => {
      try {
        const dispatcher = createDispatcher(workspace_path);
        const result = await dispatcher.dispatch('requestInput', {
          prompt,
          placeholder,
          title,
          password,
          validateInput,
        });

        const statusIcon = result.cancelled ? '❌' : '✅';
        const statusText = result.cancelled ? 'User cancelled input' : 'Input received';
        const inputText = result.userInput ? `\n📝 User input: ${result.userInput}` : '';

        return {
          content: [
            {
              type: 'text' as const,
              text: `${statusIcon} ${statusText}${inputText}`,
            },
          ],
        };
      } catch (error) {
        return formatToolCallError('Request User Input', error);
      }
    },
  );
} 