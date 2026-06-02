---
name: vscode-mcp-tool-development
description: End-to-end workflow for adding or modifying a tool in the VSCode MCP Bridge project — IPC schema → bridge service → core ToolDefinition → MCP/CLI adapters auto-pick-up. Covers schema design with zod, the `__NOT_RECOMMEND__` field-naming pattern for steering LLM agents, error handling conventions, and tool annotations. Use whenever the task touches code under `packages/vscode-mcp-{ipc,bridge,core,server,cli}/src/` — adding a new capability, changing an existing tool's params or output, or debugging an end-to-end mismatch.
---

# VSCode MCP 工具开发指南

本指南总结了在 VSCode MCP Bridge 项目中开发和维护工具的完整流程，包括从基础实现到质量优化的全套最佳实践。

## 开发流程

### 核心原则

**开发顺序**：

```plaintext
接口定义 (IPC) → 实现层 (Bridge Extension) → 工具层 (Core) → 质量优化
```

Server 和 CLI 包都是 core 的薄 adapter，循环注册 `getAllTools()`，新增 tool **不需要改 server 或 cli**（除非要给 CLI 自定义 flag mapping）。

**为什么要按这个顺序？**

- IPC 层定义了类型契约，必须最先完成
- Bridge Extension 依赖 IPC 的类型定义
- Core 调用 Bridge 的服务，复用 IPC schema
- Server / CLI adapter 自动拾取 Core 中的 ToolDefinition

**重要提醒**: 每个开发阶段完成后，都必须进行 **编译和构建验证**，确保代码质量和依赖关系正确。

## 工具架构

### 五层架构

```plaintext
MCP Client ↔ MCP Server ↔ Core ↔ IPC Layer ↔ VSCode Extension ↔ VSCode API
              CLI       ───┘
```

**职责分工**：

- **IPC Layer**: 定义类型契约和通信协议（zod schema + EventMap）
- **Bridge Extension**: 实现具体的 VSCode 操作逻辑
- **Core**: 框架无关的 ToolDefinition（schema + handler + 格式化），server/cli 共享
- **MCP Server / CLI**: 薄 adapter，把 Core 的 ToolDefinition 映射到对应入口

## 开发步骤

### 1. IPC 层：定义接口

#### 1.1 创建事件定义文件

在 [packages/vscode-mcp-ipc/src/events/](mdc:packages/vscode-mcp-ipc/src/events/) 目录中创建事件定义文件：

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

#### 1.2 注册到事件映射

更新 [packages/vscode-mcp-ipc/src/events/index.ts](mdc:packages/vscode-mcp-ipc/src/events/index.ts)：

```typescript
import type { YourToolPayload, YourToolResult } from './your-tool.js';

export * from './your-tool.js';

export interface EventMap {
  yourTool: {
    params: YourToolPayload;
    result: YourToolResult;
  };
}
```

#### 1.3 构建 IPC 包

```bash
cd packages/vscode-mcp-ipc && pnpm run build
```

### 2. Bridge Extension：实现服务

#### 2.1 创建服务实现

在 [packages/vscode-mcp-bridge/src/services/](mdc:packages/vscode-mcp-bridge/src/services/) 目录中实现服务：

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

更新 [packages/vscode-mcp-bridge/src/extension.ts](mdc:packages/vscode-mcp-bridge/src/extension.ts)：

```typescript
import { YourToolInputSchema, YourToolOutputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import { yourTool } from './services';

socketServer.register('yourTool', {
  handler: yourTool,
  payloadSchema: YourToolInputSchema,
  resultSchema: YourToolOutputSchema,
});
```

### 3. Core：创建 ToolDefinition

在 [packages/vscode-mcp-core/src/tools/](mdc:packages/vscode-mcp-core/src/tools/) 创建工具定义：

```typescript
// packages/vscode-mcp-core/src/tools/your-tool.ts
import { createDispatcher, YourToolInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import type { ToolDefinition } from '../types.js';

const DESCRIPTION = `Detailed description with usage scenarios and examples`;

export const yourTool: ToolDefinition<typeof YourToolInputSchema> = {
  name: 'your_tool',           // snake_case，MCP tool name
  cliName: 'your-tool',         // kebab-case，CLI 子命令
  title: 'Your Tool Title',
  description: DESCRIPTION,
  schema: YourToolInputSchema,
  requiresWorkspace: true,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  async handler(params, { workspacePath }) {
    const { param1, param2 } = params;
    const dispatcher = await createDispatcher(workspacePath);
    const result = await dispatcher.dispatch('yourTool', { param1, param2 });
    return `✅ Done: ${result.result}`;
  },
};
```

然后在 [packages/vscode-mcp-core/src/tools/index.ts](mdc:packages/vscode-mcp-core/src/tools/index.ts) 导出并加入 `getAllTools()`。Server / CLI 都自动拾取。

### 4. (可选) CLI 自定义 flag mapping

当工具参数包含嵌套对象或数组对象时（如 `OpenFilesInputSchema.files` 是 `Array<{filePath, showEditor}>`），无法自动生成扁平 CLI flags。这时在 ToolDefinition 上加 `cli`：

```typescript
cli: {
  options: [
    { flags: '--files <paths...>', description: 'One or more file paths' },
    { flags: '--no-show-editor', description: 'Open in background' },
  ],
  transform: (cliArgs) => ({
    files: (cliArgs.files as string[]).map((filePath) => ({
      filePath,
      showEditor: cliArgs.showEditor !== false,
    })),
  }),
},
```

## 质量标准

### 错误处理标准

handler 抛错 → adapter 接住并按 MCP/CLI 规范转换：

- **MCP adapter**: 返回 `{ isError: true, content: [{ type: 'text', text: '❌ ${title} failed: ...' }] }`
- **CLI adapter**: 打到 stderr 并 `process.exit(1)`

`handler` 内部不必 wrap try/catch，让异常自然抛即可；如果需要附加排错提示（如 health-check 的扩展安装链接），在 ToolDefinition 上加 `errorTips: string`。

### Tool Annotations 标准

根据 MCP 官方规范配置：

| Annotation        | 类型    | 默认值 | 描述               |
| ----------------- | ------- | ------ | ------------------ |
| `title`           | string  | -      | 人性化标题         |
| `readOnlyHint`    | boolean | false  | 是否只读操作       |
| `destructiveHint` | boolean | true   | 是否可能破坏性操作 |
| `idempotentHint`  | boolean | false  | 是否幂等操作       |
| `openWorldHint`   | boolean | true   | 是否与外部世界交互 |

## 最佳实践

### 1. 命名规范

- **IPC 事件名**: camelCase (`getDiagnostics`, `openFiles`)
- **MCP 工具名**: snake_case (`get_diagnostics`, `open_files`)
- **CLI 子命令名**: kebab-case (`get-diagnostics`, `open-files`)
- **文件名**: kebab-case (`get-diagnostics.ts`, `open-files.ts`)

### 2. `__NOT_RECOMMEND__` 字段命名

当某个字段虽然技术上可配，但**绝大多数情况下应使用默认值**时（agent 经常误用 narrowing 反而漏掉信息），用 `__NOT_RECOMMEND__` 前缀做"naming-as-warning"：

- `__NOT_RECOMMEND__filePaths`：默认 `[]` 让 bridge 自动检测 git modified files
- `__NOT_RECOMMEND__severities`：默认包含全部四级 severity，narrowing 通常会漏报

字段名本身是给 LLM 的反提示信号，比 description 里的劝阻更可靠。

### 3. Schema 设计

- 使用 `.describe()` 为所有参数添加描述（精炼，关键信号塞进字段名）
- 设置合理的默认值（默认应当对应"最常见、最有用"的语义）
- 使用 `.strict()` 确保类型安全
- Core 工具层必须复用 IPC 层的 Schema，不要重写

### 4. 构建验证

每个开发阶段完成后必须进行验证（VSCode 用 `mcp__vscode-mcp__get_diagnostics` 检查，避免反复跑 `pnpm run lint`）：

```bash
# IPC 层
cd packages/vscode-mcp-ipc && pnpm run build

# Bridge 层
cd packages/vscode-mcp-bridge && pnpm run compile:test

# Core 层
cd packages/vscode-mcp-core && pnpm run build

# Server / CLI 层
cd packages/vscode-mcp-server && pnpm run build
cd packages/vscode-mcp-cli && pnpm run build
```

## 开发检查清单

### 新工具开发

**基础实现:**

- [ ] 在 IPC 层定义 Schema 和类型
- [ ] 添加到 EventMap 并导出
- [ ] 构建 IPC 包
- [ ] 实现 Bridge 服务逻辑
- [ ] 在 Bridge `extension.ts` 中注册服务
- [ ] Bridge 编译验证
- [ ] 在 Core 创建 ToolDefinition（复用 IPC Schema）
- [ ] 在 `core/src/tools/index.ts` 导出并加入 `getAllTools()`
- [ ] Core / Server / CLI 构建

**质量优化:**

- [ ] handler 抛错让 adapter 处理（除非有业务态需要返 text）
- [ ] 配置合适的 Tool Annotations
- [ ] 优化 Description
- [ ] 易被 LLM 误用的字段考虑 `__NOT_RECOMMEND__` 前缀
- [ ] 验证符合 MCP 官方标准

**验证测试:**

- [ ] 编译检查所有包
- [ ] MCP / CLI 两边都跑一次，输出对齐
- [ ] 错误处理测试
- [ ] LLM 使用效果验证

## 常见问题解决

### 问题 1: 类型错误

**症状**: `Property 'xxx' does not exist on type`

**解决方案**:

1. 确保已构建 IPC 包: `cd packages/vscode-mcp-ipc && pnpm run build`
2. 检查事件是否已添加到 `EventMap`
3. 确保导入了正确的类型

### 问题 2: Schema 重复定义

**症状**: Core 工具层重新定义了 IPC 层已有的参数

**解决方案**: 直接 `schema: SomeIpcInputSchema` 复用，不要重写。MCP adapter 会自动 spread 进 `workspace_path`。

### 问题 3: 带 `.refine()` 的 Schema 没有 `.shape`

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
  (data) => data.param1 && data.param2,
  { message: '验证失败' },
);

// Core 层：复用基础 Schema
schema: YourToolBaseInputSchema,
```

遵循这个指南可以确保工具开发的一致性、可维护性和符合 MCP 官方标准。
