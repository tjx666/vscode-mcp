import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDispatcher, RequestInputInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

import { formatToolCallError } from './utils.js';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...RequestInputInputSchema.shape,
};

const DESCRIPTION = `Request simple text input from the user through VSCode input dialog.

**AI Coding Agent Use Cases:**
- When user declines a request and you need to understand the reason
- When user forgot to provide key information (screenshot paths, error messages, config values, etc.)
- When you need simple text input to continue coding tasks
- When clarification is needed for ambiguous instructions
- Getting API keys, file paths, or configuration values during development

**适用场景:**
- 获取简单的文本输入（单行）
- 获取文件路径、URL、错误信息等
- 获取用户偏好或配置值
- 快速澄清或确认信息

**Parameter Examples:**
- Request reason: prompt: "Why did you decline the previous request?", placeholder: "e.g., security concern"
- Missing info: prompt: "Please provide the screenshot path:", placeholder: "/path/to/image.png"
- Error info: prompt: "Could you paste the error message?", placeholder: "Paste error here..."
- Config value: prompt: "What's your preferred API endpoint?", placeholder: "https://api.example.com"
- Password: prompt: "Enter your database password:", password: true

**Return Format:**
- userInput: string (user's input text) or undefined if cancelled
- cancelled: boolean (true if user cancelled the dialog)

**AI Coding Agent Benefits:**
- Enables interactive debugging and problem-solving
- Allows AI to request missing information without ending the conversation
- Improves user experience by getting clarification in real-time
- Supports secure input with password masking for sensitive data

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