/**
 * 格式化工具调用错误
 * 按照 MCP 官方标准，使用 isError: true 来标识错误
 * 
 * @param toolName 工具名称
 * @param error 错误对象
 * @returns 格式化的错误响应
 */
export function formatToolCallError(toolName: string, error: unknown, additionalTips?: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: `❌ ${toolName} failed: ${String(error)} ${additionalTips ? `\n\n${additionalTips}` : ''}`
      }
    ]
  };
} 