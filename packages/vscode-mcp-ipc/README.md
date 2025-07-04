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

- `health` - 健康检查
- `getDiagnostics` - 获取诊断信息
- `getDefinition` - 获取定义
- `getReferences` - 获取引用
- `getHover` - 获取悬停信息
- `getCompletions` - 获取补全
- `getSignatureHelp` - 获取签名帮助
- `getDocumentSymbols` - 获取文档符号
- `getWorkspaceSymbols` - 获取工作区符号
- `getWorkspaceInfo` - 获取工作区信息

## Socket 路径生成

Socket 路径基于工作区路径的 MD5 哈希生成：

- Linux/macOS: `/tmp/vscode-mcp-{hash}.sock`
- Windows: `\\\\.\\pipe\\vscode-mcp-{hash}`
