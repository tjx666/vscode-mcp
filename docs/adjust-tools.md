# VSCode MCP 工具开发流程指南

本文档总结了在 VSCode MCP Bridge 项目中添加新工具或修改现有工具的标准流程。基于实际开发经验，确保按照正确的顺序进行开发以避免类型错误和依赖问题。

## 核心原则

**正确的开发顺序**：

```plaintext
接口定义 (IPC) → 实现层 (Extension) → 工具层 (MCP Server) → 注册导出
```

**为什么要按这个顺序？**

- IPC 层定义了类型契约，必须最先完成
- Extension 层依赖 IPC 的类型定义
- MCP Server 层调用 Extension 的服务
- 注册导出使所有模块连接起来

## 添加新工具流程

### 1. IPC 层：定义接口 (`packages/vscode-mcp-ipc/`)

#### 1.1 创建事件定义文件

```bash
# 创建新的事件文件
touch packages/vscode-mcp-ipc/src/events/your-tool.ts
```

#### 1.2 定义 Schema 和类型

```typescript
// packages/vscode-mcp-ipc/src/events/your-tool.ts
import { z } from 'zod';

/**
 * 输入 Schema
 */
export const YourToolInputSchema = z
  .object({
    // 定义输入参数
    param1: z.string().describe('参数描述'),
    param2: z.boolean().optional().default(true).describe('可选参数'),
  })
  .strict();

/**
 * 输出 Schema
 */
export const YourToolOutputSchema = z
  .object({
    // 定义输出结果
    result: z.string().describe('结果描述'),
  })
  .strict();

/**
 * 类型定义
 */
export type YourToolPayload = z.infer<typeof YourToolInputSchema>;
export type YourToolResult = z.infer<typeof YourToolOutputSchema>;
```

#### 1.3 注册到事件映射

```typescript
// packages/vscode-mcp-ipc/src/events/index.ts

// 1. 添加导入
import type { YourToolPayload, YourToolResult } from './your-tool.js';

// 2. 添加导出
export * from './your-tool.js';

// 3. 在 EventMap 中注册
export interface EventMap {
  /** ... 其他事件 */
  yourTool: {
    params: YourToolPayload;
    result: YourToolResult;
  };
}
```

#### 1.4 构建 IPC 包

```bash
cd packages/vscode-mcp-ipc
npm run build
```

### 2. Extension 层：实现服务 (`packages/vscode-mcp-bridge/`)

#### 2.1 创建服务实现文件

```typescript
// packages/vscode-mcp-bridge/src/services/your-tool.ts
import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';

/**
 * 处理你的工具逻辑
 */
export const yourTool = async (
  payload: EventParams<'yourTool'>,
): Promise<EventResult<'yourTool'>> => {
  try {
    // 实现具体的 VSCode 操作逻辑
    const result = await someVSCodeOperation(payload.param1);

    return {
      result,
    };
  } catch (error) {
    throw new Error(`操作失败: ${error}`);
  }
};
```

#### 2.2 导出服务

```typescript
// packages/vscode-mcp-bridge/src/services/index.ts
export { yourTool } from './your-tool';
```

#### 2.3 注册到 Extension

```typescript
// packages/vscode-mcp-bridge/src/extension.ts

// 1. 导入 Schema
import { YourToolInputSchema, YourToolOutputSchema } from '@vscode-mcp/vscode-mcp-ipc';

// 2. 导入服务
import { yourTool } from './services';

// 3. 注册服务
socketServer.register('yourTool', {
  handler: yourTool,
  payloadSchema: YourToolInputSchema,
  resultSchema: YourToolOutputSchema,
});
```

#### 2.4 构建 Extension 包

```bash
cd packages/vscode-mcp-bridge
npm run esbuild:base
```

### 3. MCP Server 层：创建工具 (`packages/vscode-mcp-server/`)

#### 3.1 创建工具文件

```typescript
// packages/vscode-mcp-server/src/tools/your-tool.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDispatcher, YourToolInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

// 复用 IPC 层的 schema，只添加 workspace_path
const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...YourToolInputSchema.shape,
};

export function registerYourTool(server: McpServer) {
  server.registerTool(
    'your_tool',
    {
      title: 'Your Tool Title',
      description: '详细描述你的工具功能',
      inputSchema,
    },
    async ({ workspace_path, param1, param2 }) => {
      const dispatcher = createDispatcher(workspace_path);

      try {
        const result = await dispatcher.dispatch('yourTool', {
          param1,
          param2,
        });

        // 格式化输出
        return {
          content: [
            {
              type: 'text',
              text: `✅ 操作成功: ${result.result}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ 操作失败: ${String(error)}`,
            },
          ],
        };
      }
    },
  );
}
```

#### 3.2 导出工具

```typescript
// packages/vscode-mcp-server/src/tools/index.ts
export { registerYourTool } from './your-tool.js';
```

#### 3.3 注册到服务器

```typescript
// packages/vscode-mcp-server/src/server.ts

// 1. 导入
import { registerYourTool } from './tools/index.js';

// 2. 注册
export function createVSCodeMCPServer(name: string, version: string): McpServer {
  // ... 其他代码

  registerYourTool(server);

  return server;
}
```

### 4. 验证和测试

#### 4.1 编译检查

```bash
# 检查所有包的编译
cd packages/vscode-mcp-ipc && npm run build
cd ../vscode-mcp-bridge && npx tsc --noEmit --project src/tsconfig.json
cd ../vscode-mcp-server && npx tsc --noEmit --project tsconfig.json
```

#### 4.2 功能测试

- 启动 VSCode Extension
- 测试 MCP 服务器连接
- 验证工具功能正常

## 修改现有工具流程

### 示例：重构 get-diagnostics 支持多文件

我们最近完成的重构案例，展示了正确的修改流程：

#### 1. 修改接口定义

```typescript
// 修改前：单个 URI
export const GetDiagnosticsInputSchema = z.object({
  uri: z.string().describe('File URI to get diagnostics for'),
});

// 修改后：多个 URI
export const GetDiagnosticsInputSchema = z.object({
  uris: z.array(z.string()).describe('Array of file URIs...'),
});
```

#### 2. 更新实现层

```typescript
// 修改服务实现以处理新的数据结构
export const getDiagnostics = async (payload: EventParams<'getDiagnostics'>) => {
  // 处理 payload.uris 而不是 payload.uri
  const files = payload.uris.map((uriString) => {
    /* ... */
  });
  return { files };
};
```

#### 3. 更新工具层

```typescript
// 更新 MCP 工具以使用新的接口和正确的 schema 复用
import { GetDiagnosticsInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...GetDiagnosticsInputSchema.shape,
};

const result = await dispatcher.dispatch('getDiagnostics', { uris });
```

## 常见问题和解决方案

### 问题 1: 类型错误

**症状**: `Property 'xxx' does not exist on type`

**解决方案**:

1. 确保已构建 IPC 包：`cd packages/vscode-mcp-ipc && npm run build`
2. 检查事件是否已添加到 `EventMap`
3. 确保导入了正确的类型

### 问题 2: 参数顺序混乱

**症状**: 多个参数时容易搞混顺序

**解决方案**: 使用对象参数而不是多个独立参数：

```typescript
// ❌ 容易搞混
register(method: EventName, handler: Function, schema1?: Schema, schema2?: Schema)

// ✅ 清晰明确
register(method: EventName, options: {
  handler: Function,
  payloadSchema?: Schema,
  resultSchema?: Schema
})
```

### 问题 3: 忘记注册服务

**症状**: 工具调用时返回 "Unknown method"

**解决方案**: 检查是否在所有必要的地方注册了服务：

1. `packages/vscode-mcp-bridge/src/extension.ts` - 注册 socket 服务
2. `packages/vscode-mcp-server/src/server.ts` - 注册 MCP 工具
3. 相应的 `index.ts` 文件中导出

### 问题 4: Schema 重复定义

**症状**: MCP 工具层重新定义了 IPC 层已有的参数

**解决方案**: 正确复用 IPC 层的 Schema：

```typescript
// ❌ 错误：重新定义参数
const inputSchema = {
  workspace_path: z.string(),
  uri: z.string(),
  line: z.number(),
  // ... 重复定义
};

// ✅ 正确：复用 IPC 层的 Schema
import { GetDefinitionInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...GetDefinitionInputSchema.shape,
};
```

### 问题 5: 带验证的 Schema 无法复用

**症状**: 使用 `.refine()` 验证的 Schema 变成 `ZodEffects` 类型，没有 `.shape` 属性

**解决方案**: 分离基础 Schema 和验证 Schema：

```typescript
// IPC 层：分离基础 Schema 和验证 Schema
export const YourToolBaseInputSchema = z
  .object({
    param1: z.string().describe('参数1'),
    param2: z.string().optional().describe('参数2'),
  })
  .strict();

export const YourToolInputSchema = YourToolBaseInputSchema.refine(
  (data) => {
    // 验证逻辑
    return data.param1 && data.param2;
  },
  { message: '验证失败' },
);

// MCP Server 层：复用基础 Schema
import { YourToolBaseInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...YourToolBaseInputSchema.shape, // ✅ 复用基础 Schema
};
```

## 最佳实践

### 1. 命名规范

- **事件名**: 使用 camelCase (如 `getDiagnostics`, `openFiles`)
- **工具名**: 使用 snake_case (如 `get_diagnostics`, `open_files`)
- **文件名**: 使用 kebab-case (如 `get-diagnostics.ts`, `open-files.ts`)

### 2. 错误处理

- Extension 层：抛出有意义的错误信息
- MCP 工具层：捕获错误并返回用户友好的消息
- 使用表情符号和格式化文本提升用户体验

### 3. Schema 设计

- 使用 `.describe()` 为所有参数添加描述
- 设置合理的默认值
- 使用 `.strict()` 确保类型安全
- **重要**：MCP 工具层必须复用 IPC 层的 Schema，避免重复定义

### 4. 输出格式化

- 使用一致的状态图标 (✅ ❌ 🔍 📄)
- 提供详细的操作反馈
- 统计成功/失败数量

## 工具开发检查清单

### 新工具开发

- [ ] 在 IPC 层定义 Schema 和类型
- [ ] 添加到 EventMap 并导出
- [ ] 构建 IPC 包
- [ ] 实现 Extension 服务逻辑
- [ ] 在 Extension 中注册服务
- [ ] 构建 Extension 包
- [ ] 创建 MCP 工具实现（正确复用 IPC Schema）
- [ ] 导出并注册 MCP 工具
- [ ] 编译检查所有包
- [ ] 功能测试验证

### 工具修改

- [ ] 分析现有接口定义
- [ ] 按顺序修改：IPC → Extension → MCP Server
- [ ] 保持向后兼容性（如果需要）
- [ ] 更新相关文档和示例
- [ ] 全面测试修改后的功能

## 参考示例

完整的工具实现可以参考项目中的现有工具：

- `get-definition`: 正确的 Schema 复用示例
- `get-diagnostics`: 复杂的批量操作和条件逻辑
- `open-files`: 批量操作和可选参数处理
- `execute-command`: 简单的参数传递和命令执行
- `health`: 最简单的无参数工具
- `open-diff`: 分离基础 Schema 和验证 Schema 的示例，支持多种参数模式

遵循这个流程可以确保工具开发的一致性和可维护性。
