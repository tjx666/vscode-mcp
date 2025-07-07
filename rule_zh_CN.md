# 工具调用完整指南

## 🔧 环境说明

### 开发环境

- **OS**: macOS 15.5
- **Hardware**: Apple Silicon (M4 Pro)
- **IDE**: Cursor（VSCode 的 fork）
- **Default Terminal Editor**: `cursor`

你已经处在一个打开的 Cursor 工作区环境中，可以使用所有 vscode-mcp 提供的工具。

## 🎯 核心原则

### 1. 工具选择优先级

1. **具体代码位置已知** → 优先使用 VSCode LSP 工具
2. **需要探索和搜索** → 使用内置搜索工具
3. **复杂操作需求** → 使用终端命令行工具

### 2. 基本原则

- codebase_search, grep_search 适合在不清楚代码位置时收集上下文
- vscode-mcp 提供的 LSP tools 适合在清楚代码位置时获取精确代码信息
- 终端工具适合处理复杂的文件操作和包管理任务

## 🛠️ 工具分类详解

### 1. VSCode LSP 工具（精确代码分析）

| 工具名称             | 用途               | 使用场景                |
| -------------------- | ------------------ | ----------------------- |
| `get_definition`     | 跳转到符号定义     | 查看函数/变量的定义位置 |
| `get_references`     | 查找所有引用位置   | 评估修改影响范围        |
| `get_hovers`         | 获取类型信息和文档 | 理解代码含义和类型      |
| `get_diagnostics`    | 获取错误和警告信息 | 排查代码问题            |
| `get_signature_help` | 获取函数签名帮助   | 调用函数时获取参数信息  |
| `rename_symbol`      | 重命名符号         | 安全地重构代码          |
| `highlight_code`     | 高亮显示代码区域   | 可视化展示重要代码片段  |
| `open_files`         | 批量打开文件       | 提高 LSP 准确性         |

#### 🎯 代码高亮最佳实践

**核心原则**：AI 找到代码后，**必须使用 `highlight_code` 进行可视化展示**

- 🚀 **替代文字描述**：不要说"查看第 10-15 行"，直接高亮显示

记住：选择正确的工具能让任务事半功倍！**可视化展示代码比文字描述更有效！**

### 2. 内置搜索工具（代码探索）

| 工具名称          | 用途                   | 限制               |
| ----------------- | ---------------------- | ------------------ |
| `codebase_search` | 语义搜索，理解代码意图 | 适合概念性搜索     |
| `grep_search`     | 文本搜索，精确匹配     | 最多返回 50 个结果 |
| `file_search`     | 文件名搜索             | 模糊匹配文件路径   |

### 3. 终端命令行工具（复杂操作）

通过 `run_terminal_cmd` 使用以下现代化工具：

| 任务类型     | 传统工具     | **推荐工具**       | 使用理由              |
| ------------ | ------------ | ------------------ | --------------------- |
| **文件查找** | `find`       | `fd`               | 更快速、语法友好      |
| **代码搜索** | `grep`       | `ripgrep` (`rg`)   | 极快、遵守 .gitignore |
| **结构重构** | `grep`/正则  | `ast-grep` (`sg`)  | 基于 AST，更精确      |
| **Git 操作** | `git`        | `gh`               | GitHub 集成           |
| **包管理**   | `npm`/`pnpm` | `@antfu/ni` (`ni`) | 统一的包管理器命令    |
| **运行脚本** | `node`       | `tsx`              | 直接运行 TypeScript   |

### 4. 其他可用工具

- **交互工具**: `fzf`（模糊查找）、`zoxide`（智能 cd）
- **文件查看**: `bat`（语法高亮 cat）、`delta`（更好的 git diff）
- **系统分析**: `dust`（磁盘使用）、`tokei`（代码统计）

## 🎯 决策流程图

```plaintext
问题：需要处理代码相关任务

1. 我知道具体的代码位置吗？
   ├─ 是 → 使用 VSCode LSP 工具
   │   ├─ 查看定义 → get_definition
   │   ├─ 查找引用 → get_references
   │   ├─ 获取类型 → get_hovers
   │   ├─ 检查错误 → get_diagnostics
   │   └─ 展示代码 → highlight_code
   └─ 否 → 继续下一步

2. 我知道要查找什么吗？
   ├─ 知道具体代码/函数名 → grep_search 或 rg
   ├─ 需要理解功能/概念 → codebase_search
   ├─ 只知道文件名 → file_search 或 fd
   └─ 需要复杂模式匹配 → ast-grep

3. 需要进行什么操作？
   ├─ 包管理 → ni/nr/nun
   ├─ 运行脚本 → tsx
   └─ Git 操作 → gh
```

## 📝 实际使用示例

### 场景对比

#### 场景1：理解函数功能

- ✅ **正确**: 使用 `get_hovers` 获取函数文档
- ❌ **错误**: 使用 `codebase_search` 搜索函数名

#### 场景2：查找变量使用

- ✅ **正确**: 使用 `get_references` 查找所有引用
- ❌ **错误**: 使用 `grep_search`（可能有误报）

#### 场景3：安装依赖

- ✅ **正确**: 使用 `ni` 安装依赖
- ❌ **错误**: 手动判断并使用 npm/yarn/pnpm

#### 场景4：大规模搜索

- ✅ **正确**: 使用 `rg` 进行无限制搜索
- ❌ **错误**: 使用 `grep_search`（限制 50 个结果）

#### 场景5：代码展示和说明

- ✅ **正确**: 使用 `highlight_code` 可视化高亮重要代码
- ❌ **错误**: 仅通过文字描述代码位置

## 💡 最佳实践

### 1. 工具组合使用

```plaintext
搜索工具找位置 → LSP 工具获取详细信息 → 终端工具执行操作
```

### 2. 选择策略

- **内置工具优先**：速度快，返回结构化结果
- **终端工具补充**：处理内置工具的限制情况
- **VSCode 工具精确**：已知位置时的首选

### 3. 性能优化

- 使用 `open_files` 批量加载文件，提高 LSP 准确性
- 遇到错误时优先使用 `get_diagnostics`
- 修改前使用 `get_references` 评估影响
- 代码分析完成后使用 `highlight_code` 提升用户体验

### 4. 常见组合

- **探索 + 分析**: `codebase_search` → `get_definition` → `get_references`
- **错误排查**: `get_diagnostics` → `get_hovers` → `grep_search`
- **重构流程**: `get_references` → `rename_symbol`
- **代码展示**: `codebase_search` → `get_definition` → `highlight_code`

## ❌ 常见误区

1. **过度使用搜索**：已知代码位置时仍使用搜索工具
2. **忽略 LSP 信息**：手动分析代码而不用类型信息
3. **工具选择不当**：用 grep_search 处理需要 AST 的任务
4. **忽视工具限制**：不知道 grep_search 有 50 个结果限制
5. **不使用代码高亮**：找到代码后仅描述位置，不进行可视化展示

## 🚀 快速参考

### 按任务选择工具

- **查看代码定义** → `get_definition`
- **找到所有使用** → `get_references`
- **理解代码类型** → `get_hovers` / `get_signature_help`
- **检查错误警告** → `get_diagnostics`
- **高亮显示代码** → `highlight_code`
- **搜索代码概念** → `codebase_search`
- **精确文本匹配** → `grep_search` 或 `rg`
- **查找文件路径** → `file_search` 或 `fd`
- **安装依赖包** → `ni`
- **运行 TS 文件** → `tsx`
