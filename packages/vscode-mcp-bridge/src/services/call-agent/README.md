# Agent Call Architecture

## 概述

基于 [stagewise](https://github.com/stagewise-io/stagewise) 项目的成功架构，重新设计了 call-agent 工具的实现，提供了更完整、更可靠的多 IDE AI Agent 调用功能。

## 架构设计

### 📁 文件结构

```
src/services/
├── agent-types.ts         # 统一的类型定义
├── ide-detection.ts       # IDE类型检测
├── agent-detection.ts     # Agent扩展检测
├── diagnostic-injection.ts # 诊断注入工具
├── agent-callers.ts       # 各种Agent调用实现
├── agent-dispatcher.ts    # 统一分发逻辑
└── call-agent.ts          # 主要服务接口
```

### 🎯 支持的IDE和Agent

#### IDE类型

- **CURSOR**: Cursor编辑器
- **WINDSURF**: Windsurf编辑器
- **TRAE**: Trae IDE
- **VSCODE**: VSCode + 各种AI扩展

#### VSCode支持的Agent扩展

按优先级排序：

1. **Cline** (`saoudrizwan.claude-dev`)
2. **Roocode** (`RooVeterinaryInc.roocode`)
3. **Kilocode** (`kilocode.kilocode`)
4. **GitHub Copilot** (`GitHub.copilot-chat`)
5. **Continue** (`Continue.continue`)

### 🏗️ 三种调用模式

#### 模式A: 简单命令调用

**适用于**: Trae、Copilot

```typescript
await vscode.commands.executeCommand('workbench.action.chat.icube.open', {
  query: prompt,
  newChat: true,
  keepOpen: true,
});
```

#### 模式B: 诊断注入模式

**适用于**: Cursor、Windsurf

```typescript
await injectPromptDiagnosticWithCallback({
  prompt: promptWithPrefix,
  callback: () => vscode.commands.executeCommand('composer.fixerrormessage'),
});
```

#### 模式C: 复杂诊断处理

**适用于**: Cline

```typescript
const diagnostic = new vscode.Diagnostic(range, prompt, vscode.DiagnosticSeverity.Error);
await vscode.commands.executeCommand('cline.fixWithCline', range, [diagnostic]);
```

### 🔄 分发流程

```
用户请求 → IDE检测 → Agent选择 → 调用执行 → 结果返回
         ↓
    1. 检测当前IDE类型
    2. 如果是VSCode，按优先级选择可用Agent
    3. 使用对应的调用模式
    4. 返回执行结果
```

### 💡 关键特性

1. **智能IDE检测**: 基于环境变量和命令自动检测IDE类型
2. **扩展检测**: 动态检测已安装的AI Agent扩展
3. **优先级排序**: VSCode环境下按优先级自动选择最佳Agent
4. **错误处理**: 友好的错误消息和安装指导
5. **统一接口**: 所有Agent使用相同的数据结构
6. **前缀策略**: 每个Agent都有特定的提示前缀，优化AI理解
7. **多文件支持**: 支持传入文件列表和图像列表

### 🚀 使用示例

```typescript
import { dispatchAgentCall } from './agent-dispatcher.js';

const result = await dispatchAgentCall({
  prompt: '重构这个函数以提高性能',
  files: ['src/utils.ts', 'src/types.ts'],
  ide_type: 'auto', // 自动检测，或指定 "cursor", "vscode" 等
});

console.log(result.success); // true/false
console.log(result.message); // 执行结果消息
console.log(result.ide_detected); // 检测到的 IDE 类型
console.log(result.command_executed); // 执行的具体命令
```

## 对比原实现的改进

### ✅ 新架构优势

1. **模块化设计**: 清晰的职责分离，易于维护和扩展
2. **更多Agent支持**: 支持5种VSCode Agent + 3种独立IDE
3. **更好的错误处理**: 详细的错误信息和用户指导
4. **类型安全**: 完整的TypeScript类型定义
5. **成熟的实现**: 基于stagewise项目的生产级架构
6. **诊断注入**: 正确实现了Cursor/Windsurf的诊断注入机制

### 📈 功能对比

| 功能            | 原实现 | 新实现 |
| --------------- | ------ | ------ |
| 支持的Agent数量 | 3个    | 8个    |
| IDE检测准确性   | 基础   | 高级   |
| 错误处理        | 简单   | 完善   |
| 代码结构        | 单文件 | 模块化 |
| 类型安全        | 部分   | 完整   |
| 扩展性          | 有限   | 很好   |

## 未来扩展

这个架构设计为未来扩展预留了接口：

1. **新IDE支持**: 在 `ide-detection.ts` 中添加检测逻辑
2. **新Agent支持**: 在 `agent-detection.ts` 和 `agent-callers.ts` 中添加实现
3. **新调用模式**: 在 `agent-callers.ts` 中实现新的调用策略
4. **配置化**: 可以添加配置文件来自定义优先级和行为

这个重新设计的架构为VSCode MCP Bridge项目提供了更加强大和可靠的Agent调用能力。
