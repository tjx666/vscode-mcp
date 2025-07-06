# VSCode MCP 工具开发指南

本文档总结了在 VSCode MCP Bridge 项目中开发和维护工具的完整流程，包括从基础实现到质量优化的全套最佳实践。

## 目录

1. [开发流程](#开发流程)
2. [工具架构](#工具架构)
3. [开发步骤](#开发步骤)
4. [质量标准](#质量标准)
5. [最佳实践](#最佳实践)
6. [问题解决](#问题解决)
7. [参考示例](#参考示例)

## 开发流程

### 核心原则

**开发顺序**：

```plaintext
接口定义 (IPC) → 实现层 (Extension) → 工具层 (MCP Server) → 质量优化
```

**为什么要按这个顺序？**

- IPC 层定义了类型契约，必须最先完成
- Extension 层依赖 IPC 的类型定义
- MCP Server 层调用 Extension 的服务
- 质量优化确保符合 MCP 官方标准

**重要提醒**: 每个开发阶段完成后，都必须进行 **编译和构建验证**，确保代码质量和依赖关系正确。

## 工具架构

### 三层架构

```plaintext
MCP Client ↔ MCP Server ↔ IPC Layer ↔ VSCode Extension ↔ VSCode API
```

**职责分工**：

- **IPC Layer**: 定义类型契约和通信协议
- **Extension Layer**: 实现具体的 VSCode 操作逻辑
- **MCP Server Layer**: 提供标准化的 MCP 工具接口

## 开发步骤

### 1. IPC 层：定义接口

#### 1.1 创建事件定义文件

```bash
touch packages/vscode-mcp-ipc/src/events/your-tool.ts
```

#### 1.2 定义 Schema 和类型

```typescript
// packages/vscode-mcp-ipc/src/events/your-tool.ts
import { z } from 'zod';

export const YourToolInputSchema = z
  .object({
    param1: z.string().describe('参数描述'),
    param2: z.boolean().optional().default(true).describe('可选参数'),
  })
  .strict();

export const YourToolOutputSchema = z
  .object({
    result: z.string().describe('结果描述'),
  })
  .strict();

export type YourToolPayload = z.infer<typeof YourToolInputSchema>;
export type YourToolResult = z.infer<typeof YourToolOutputSchema>;
```

#### 1.3 注册到事件映射

```typescript
// packages/vscode-mcp-ipc/src/events/index.ts
import type { YourToolPayload, YourToolResult } from './your-tool.js';

export * from './your-tool.js';

export interface EventMap {
  yourTool: {
    params: YourToolPayload;
    result: YourToolResult;
  };
}
```

#### 1.4 构建 IPC 包

```bash
cd packages/vscode-mcp-ipc && npm run build
```

### 2. Extension 层：实现服务

#### 2.1 创建服务实现

```typescript
// packages/vscode-mcp-bridge/src/services/your-tool.ts
import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';

export const yourTool = async (
  payload: EventParams<'yourTool'>,
): Promise<EventResult<'yourTool'>> => {
  try {
    const result = await someVSCodeOperation(payload.param1);
    return { result };
  } catch (error) {
    throw new Error(`操作失败: ${error}`);
  }
};
```

#### 2.2 注册服务

```typescript
// packages/vscode-mcp-bridge/src/extension.ts
import { YourToolInputSchema, YourToolOutputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import { yourTool } from './services';

socketServer.register('yourTool', {
  handler: yourTool,
  payloadSchema: YourToolInputSchema,
  resultSchema: YourToolOutputSchema,
});
```

#### 2.3 编译验证

```bash
# 编译测试验证（Extension 层不需要构建，只需要验证编译）
cd packages/vscode-mcp-bridge && npm run compile:test
```

### 3. MCP Server 层：创建工具

#### 3.1 创建工具文件

```typescript
// packages/vscode-mcp-server/src/tools/your-tool.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDispatcher, YourToolInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

import { formatToolCallError } from './utils.js';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...YourToolInputSchema.shape,
};

export function registerYourTool(server: McpServer) {
  server.registerTool(
    'your_tool',
    {
      title: 'Your Tool Title',
      description: 'Detailed description with usage scenarios and examples',
      inputSchema,
      annotations: {
        title: 'Your Tool Title',
        readOnlyHint: true, // 根据实际情况设置
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ workspace_path, param1, param2 }) => {
      try {
        const dispatcher = createDispatcher(workspace_path);
        const result = await dispatcher.dispatch('yourTool', { param1, param2 });

        return {
          content: [
            {
              type: 'text' as const,
              text: `✅ 操作成功: ${result.result}`,
            },
          ],
        };
      } catch (error) {
        return formatToolCallError('Your Tool Title', error);
      }
    },
  );
}
```

#### 3.2 导出和注册

```typescript
// packages/vscode-mcp-server/src/tools/index.ts
export { registerYourTool } from './your-tool.js';

// packages/vscode-mcp-server/src/server.ts
import { registerYourTool } from './tools/index.js';

export function createVSCodeMCPServer(name: string, version: string): McpServer {
  registerYourTool(server);
  return server;
}
```

#### 3.3 构建

```bash
# 构建 MCP Server 包（build 命令包含类型检查）
cd packages/vscode-mcp-server && npm run build
```

## 质量标准

### 错误处理标准

遵循 [MCP 官方错误处理规范](https://modelcontextprotocol.io/docs/concepts/tools#error-handling)：

#### 统一错误处理函数

```typescript
// packages/vscode-mcp-server/src/tools/utils.ts
export function formatToolCallError(toolName: string, error: unknown) {
  return {
    isError: true, // MCP 官方要求
    content: [
      {
        type: 'text' as const,
        text: `❌ ${toolName} failed: ${String(error)}`,
      },
    ],
  };
}
```

#### 在工具中使用

```typescript
try {
  // 工具逻辑
} catch (error) {
  return formatToolCallError('Tool Name', error);
}
```

### Tool Annotations 标准

根据 [MCP 官方规范](https://modelcontextprotocol.io/docs/concepts/tools#tool-annotations) 配置：

| Annotation        | 类型    | 默认值 | 描述               |
| ----------------- | ------- | ------ | ------------------ |
| `title`           | string  | -      | 人性化标题         |
| `readOnlyHint`    | boolean | false  | 是否只读操作       |
| `destructiveHint` | boolean | true   | 是否可能破坏性操作 |
| `idempotentHint`  | boolean | false  | 是否幂等操作       |
| `openWorldHint`   | boolean | true   | 是否与外部世界交互 |

#### 工具分类示例

```typescript
// 只读工具
const readOnlyToolAnnotations = {
  title: 'Get Definition',
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

// 危险工具
const dangerousToolAnnotations = {
  title: '⚠️ Execute VSCode Command',
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
};
```

### Description 优化标准

#### 建议结构

```typescript
const description = `Brief functional description. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- How AI agents can leverage this tool effectively
- What coding problems it solves for AI development
- How it integrates with AI coding workflows

**Parameter Examples:**
- Example 1: specific parameter format
- Example 2: special usage scenario

**Return Format:** 
Brief description of returned data structure

**Important Notes:**
Key limitations or special behaviors`;
```

#### 优化示例

**优化前:**

```plaintext
"Get definition locations for a symbol at a specific position"
```

**优化后:**

```plaintext
"Navigate to the definition of a symbol (variable, function, class, etc.) at a specific position.

**Use Cases:**
- Find where a symbol is declared/defined
- Understand the implementation of a function/class
- Navigate through code dependencies before making changes

**Parameter Examples:**
- Jump to function: uri: 'file:///path/to/file.ts', line: 10, character: 15
- Find class: uri: 'file:///component.tsx', line: 25, character: 8

**Return Format:**
Array of Location objects with file URI and exact position coordinates

**Important Notes:**
- Line and character numbers are zero-based
- Returns empty array if no definition found"
```

## 最佳实践

### 1. 命名规范

- **事件名**: camelCase (`getDiagnostics`, `openFiles`)
- **工具名**: snake_case (`get_diagnostics`, `open_files`)
- **文件名**: kebab-case (`get-diagnostics.ts`, `open-files.ts`)

### 2. 错误处理

- 统一使用 `formatToolCallError` 函数
- 必须设置 `isError: true`
- 提供有意义的错误信息
- 避免暴露内部错误详情

### 3. Tool Annotations

- 准确设置 `readOnlyHint` 区分只读和状态修改
- 为危险操作添加警告标识
- 合理设置幂等性标识
- VSCode 工具通常设置 `openWorldHint: false`

### 4. Description 优化

- 使用结构化格式包含使用场景、示例、返回格式
- 提供具体的参数使用示例
- 说明返回数据的结构
- 标注重要的限制和特殊行为

### 5. Schema 设计

- 使用 `.describe()` 为所有参数添加描述
- 设置合理的默认值
- 使用 `.strict()` 确保类型安全
- MCP 工具层必须复用 IPC 层的 Schema

### 6. 输出格式化

- 使用一致的状态图标 (✅ ❌ 🔍 📄)
- 提供详细的操作反馈
- 统计成功/失败数量

## 问题解决

### 常见问题

#### 问题 1: 类型错误

**症状**: `Property 'xxx' does not exist on type`

**解决方案**:

1. 确保已构建 IPC 包: `cd packages/vscode-mcp-ipc && npm run build`
2. 检查事件是否已添加到 `EventMap`
3. 确保导入了正确的类型

#### 问题 2: Schema 重复定义

**症状**: MCP 工具层重新定义了 IPC 层已有的参数

**解决方案**: 正确复用 IPC 层的 Schema

```typescript
// ❌ 错误：重新定义参数
const inputSchema = {
  workspace_path: z.string(),
  uri: z.string(),
  line: z.number(),
};

// ✅ 正确：复用 IPC 层的 Schema
import { GetDefinitionInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...GetDefinitionInputSchema.shape,
};
```

#### 问题 3: 带验证的 Schema 无法复用

**症状**: 使用 `.refine()` 的 Schema 变成 `ZodEffects` 类型，没有 `.shape` 属性

**解决方案**: 分离基础 Schema 和验证 Schema

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
    return data.param1 && data.param2;
  },
  { message: '验证失败' },
);

// MCP Server 层：复用基础 Schema
import { YourToolBaseInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...YourToolBaseInputSchema.shape,
};
```

### 开发检查清单

#### 新工具开发

**基础实现:**

- [ ] 在 IPC 层定义 Schema 和类型
- [ ] 添加到 EventMap 并导出
- [ ] 构建 IPC 包
- [ ] 实现 Extension 服务逻辑
- [ ] 在 Extension 中注册服务
- [ ] Extension 层编译验证
- [ ] 创建 MCP 工具实现（正确复用 IPC Schema）
- [ ] 导出并注册 MCP 工具
- [ ] MCP Server 层构建

**质量优化:**

- [ ] 添加统一错误处理（使用 `formatToolCallError`）
- [ ] 配置合适的 Tool Annotations
- [ ] 优化 Description（包含场景、示例、格式说明）
- [ ] 验证符合 MCP 官方标准

**验证测试:**

- [ ] 编译检查所有包
  - [ ] `cd packages/vscode-mcp-ipc && npm run build`
  - [ ] `cd packages/vscode-mcp-bridge && npm run compile:test`
  - [ ] `cd packages/vscode-mcp-server && npm run build`
- [ ] 功能测试验证
- [ ] 错误处理测试
- [ ] LLM 使用效果验证

#### 工具修改

**修改流程:**

- [ ] 分析现有接口定义
- [ ] 按顺序修改：IPC → Extension → MCP Server
- [ ] 保持向后兼容性（如果需要）
- [ ] 各层编译和构建验证

**质量检查:**

- [ ] 验证错误处理是否使用统一方法
- [ ] 检查 Tool Annotations 是否准确
- [ ] 确认 Description 是否足够详细
- [ ] 测试 LLM 使用体验

**文档更新:**

- [ ] 更新 `README.md` 中的工具列表和描述
- [ ] 更新 `packages/vscode-mcp-ipc/README.md` 中的使用示例（如有新事件）
- [ ] 更新相关使用文档和示例
- [ ] 根据开发过程中遇到的新问题，按需更新本文档 (`docs/adjust-tools.md`)
- [ ] 全面测试修改后的功能

## 参考示例

### 最佳实践示例

- **get-definition**: 正确的 Schema 复用 + 统一错误处理 + 完整 Annotations
- **execute-command**: 安全警告标识 + 危险操作 Annotations
- **get-diagnostics**: 复杂批量操作 + Git 集成说明

### 开发模式参考

- **get-hovers**: 批量位置处理，支持多选项的高级工具
- **open-files**: 批量操作和可选参数处理
- **health**: 最简单的无参数工具
- **open-diff**: 分离基础 Schema 和验证 Schema 的示例

### 演进历程

- **基础功能**: 实现核心的 VSCode API 调用
- **错误处理**: 添加统一的错误处理机制
- **标准化**: 配置 Tool Annotations 符合 MCP 规范
- **优化体验**: 改进 Description 提升 LLM 使用效果

遵循这个指南可以确保工具开发的一致性、可维护性和符合 MCP 官方标准。

## 文档维护策略

### 核心原则

**同步更新**：代码变更和文档更新必须同步进行，避免文档滞后导致的信息不一致。

### 必须更新的文档

#### 1. **主要文档文件**

- **`README.md`**: 工具列表、使用说明、安装指南
- **`packages/vscode-mcp-ipc/README.md`**: 事件列表、API 说明、使用示例
- **`docs/project-architecture.md`**: 架构设计、组件职责说明
- **`docs/adjust-tools.md`**: 开发指南、最佳实践、问题解决方案

#### 2. **更新时机和内容**

| 变更类型         | 必须更新的文档                      | 更新内容                         |
| ---------------- | ----------------------------------- | -------------------------------- |
| **新增工具**     | `README.md`                         | 工具列表、参数说明、使用注意事项 |
| **新增事件**     | `packages/vscode-mcp-ipc/README.md` | 事件示例、参数说明               |
| **架构调整**     | `docs/project-architecture.md`      | 组件关系、通信流程               |
| **开发流程变化** | `docs/adjust-tools.md`              | 开发步骤、最佳实践               |
| **遇到新问题**   | `docs/adjust-tools.md`              | 问题解决章节、开发检查清单       |

### 文档质量保证

#### 更新检查清单

**每次工具变更后：**

- [ ] README.md 的工具表格是否包含新工具？
- [ ] 工具描述是否准确反映实际功能？
- [ ] 参数说明是否完整且正确？
- [ ] 安全警告是否适当标注？
- [ ] 使用示例是否有效且最新？

**每次遇到开发问题后：**

- [ ] 问题是否已记录在 `docs/adjust-tools.md` 中？
- [ ] 解决方案是否清晰可执行？
- [ ] 是否需要更新开发检查清单？
- [ ] 是否需要补充最佳实践说明？

### 持续改进

**反馈循环**：根据实际开发过程中遇到的问题，持续更新和完善开发指南。

**经验积累**：将每次解决的问题和总结的经验及时记录，形成知识库。

**标准化流程**：确保每个开发者都能按照统一的标准进行工具开发和文档维护。
