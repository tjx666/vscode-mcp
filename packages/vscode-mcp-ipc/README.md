# vscode-mcp-ipc

IPC communication layer between MCP Server and VSCode extension.

## 功能

- 定义 MCP Server 和 VSCode 扩展之间的事件和数据结构
- 提供 Unix Socket 通信的封装
- 支持类型安全的事件调度

## 使用方法

### 创建 Dispatcher

```typescript
import { createDispatcher } from '@vscode-mcp/vscode-mcp-ipc';

const dispatcher = createDispatcher('/path/to/workspace');
```

### 发送事件

```typescript
// 获取诊断信息
const diagnostics = await dispatcher.dispatch('getDiagnostics', {
  uri: 'file:///path/to/file.ts',
});

// 获取定义
const definitions = await dispatcher.dispatch('getDefinition', {
  uri: 'file:///path/to/file.ts',
  line: 10,
  character: 5,
});

// 健康检查
const health = await dispatcher.dispatch('health', {});

// 请求用户输入
const input = await dispatcher.dispatch('requestInput', {
  prompt: 'Please enter your API key:',
  placeholder: 'Enter API key here...',
  title: 'API Configuration',
  password: true,
  validateInput: true,
});

// 执行 VSCode 命令
const result = await dispatcher.dispatch('executeCommand', {
  command: 'editor.action.formatDocument',
});

// 执行带参数的 VSCode 命令
const openResult = await dispatcher.dispatch('executeCommand', {
  command: 'vscode.open',
  args: ['file:///path/to/file.ts'],
});
```

### 测试连接

```typescript
const isConnected = await dispatcher.testConnection();
if (isConnected) {
  console.log('Connected to VSCode extension');
} else {
  console.log('Failed to connect');
}
```

## 支持的事件

查看 `src/events/index.ts` 中的 `EventMap` 接口来了解所有可用的事件类型和参数。

每个事件都有对应的输入和输出类型定义，确保类型安全的通信。

## Socket 路径生成

Socket 路径基于工作区路径的 MD5 哈希生成：

- Linux/macOS: `/tmp/vscode-mcp-{hash}.sock`
- Windows: `\\\\.\\pipe\\vscode-mcp-{hash}`
