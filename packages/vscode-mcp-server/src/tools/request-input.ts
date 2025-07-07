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
- **Handle command execution rejections**: When user declines to execute a command, understand why and what they actually want
- **Clarify task understanding**: When AI agent's approach seems wrong to the user, ask for guidance on the correct direction
- **Recover from misunderstandings**: When user rejects proposed solutions, ask for clarification on requirements

**Parameter Examples:**
- Request reason: prompt: "Why did you decline the previous request?", placeholder: "e.g., security concern, wrong approach"
- **Task clarification**: prompt: "You declined to run 'npm install'. What would you prefer to do instead?", placeholder: "e.g., use pnpm, skip installation, different package"
- **Understanding correction**: prompt: "It seems my approach was wrong. Could you clarify what you actually want to achieve?", placeholder: "e.g., different goal, specific requirements"
- **Alternative approach**: prompt: "You rejected the suggested solution. What's the correct way to proceed?", placeholder: "e.g., use different tool, manual process, alternative method"
- Missing info: prompt: "Please provide the screenshot path:", placeholder: "/path/to/image.png"
- Error info: prompt: "Could you paste the error message?", placeholder: "Paste error here..."
- Config value: prompt: "What's your preferred API endpoint?", placeholder: "https://api.example.com"
- Password: prompt: "Enter your database password:", password: true
- **Request help after failed attempts**: prompt: "I've tried multiple approaches to fix this issue but none worked. Could you provide some hints or suggest a different approach?", placeholder: "e.g., specific error details, alternative solution, missing context"

**Return Format:**
- userInput: string (user's input text) or undefined if cancelled
- cancelled: boolean (true if user cancelled the dialog)

**Important Notes:**
- Best for simple, single-line text input
- Use password: true for sensitive information
- Always handle cancellation gracefully
- Input validation can be enabled to prevent empty submissions
- **CRITICAL**: Use this tool when user rejects commands to understand their actual intent and requirements
- **CRITICAL**: Essential for recovering from AI agent misunderstandings and getting back on track`;

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