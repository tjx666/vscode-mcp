# Complete Tool Usage Guide

## 🔧 Environment Description

### Development Environment

- **OS**: macOS 15.5
- **Hardware**: Apple Silicon (M4 Pro)
- **IDE**: Cursor (VSCode fork)
- **Default Terminal Editor**: `cursor`

You are already in an open Cursor workspace environment and can use all tools provided by vscode-mcp.

## 🎯 Core Principles

### 1. Tool Selection Priority

1. **Specific code location known** → Prioritize VSCode LSP tools
2. **Need exploration and search** → Use built-in search tools
3. **Complex operation requirements** → Use terminal command-line tools

### 2. Basic Principles

- codebase_search, grep_search are suitable for collecting context when code location is unclear
- vscode-mcp LSP tools are suitable for obtaining precise code information when code location is known
- Terminal tools are suitable for handling complex file operations and package management tasks

## 🛠️ Tool Classification Details

### 1. VSCode LSP Tools (Precise Code Analysis)

| Tool Name            | Purpose                         | Use Cases                                  |
| -------------------- | ------------------------------- | ------------------------------------------ |
| `get_definition`     | Jump to symbol definition       | View function/variable definition location |
| `get_references`     | Find all reference locations    | Assess modification impact scope           |
| `get_hovers`         | Get type info and documentation | Understand code meaning and types          |
| `get_diagnostics`    | Get error and warning info      | Troubleshoot code issues                   |
| `get_signature_help` | Get function signature help     | Get parameter info when calling functions  |
| `rename_symbol`      | Rename symbols                  | Safely refactor code                       |
| `highlight_code`     | Highlight code regions          | Visualize important code snippets          |
| `open_files`         | Batch open files                | Improve LSP accuracy                       |

#### 🎯 Code Highlighting Best Practices

**Core Principle**: After AI finds code, **must use `highlight_code` for visual demonstration**

- 🚀 **Replace text descriptions**: Don't say "check lines 10-15", directly highlight

Remember: Choosing the right tool makes tasks twice as effective! **Visual code display is more effective than text descriptions!**

### 2. Built-in Search Tools (Code Exploration)

| Tool Name         | Purpose                                 | Limitations                      |
| ----------------- | --------------------------------------- | -------------------------------- |
| `codebase_search` | Semantic search, understand code intent | Suitable for conceptual searches |
| `grep_search`     | Text search, exact matching             | Max 50 results                   |
| `file_search`     | File name search                        | Fuzzy matching file paths        |

### 3. Terminal Command-line Tools (Complex Operations)

Use the following modern tools through `run_terminal_cmd`:

| Task Type                 | Traditional Tool | **Recommended Tool** | Reason                              |
| ------------------------- | ---------------- | -------------------- | ----------------------------------- |
| **File Finding**          | `find`           | `fd`                 | Faster, friendly syntax             |
| **Code Search**           | `grep`           | `ripgrep` (`rg`)     | Extremely fast, respects .gitignore |
| **Structure Refactoring** | `grep`/regex     | `ast-grep` (`sg`)    | AST-based, more precise             |
| **Git Operations**        | `git`            | `gh`                 | GitHub integration                  |
| **Package Management**    | `npm`/`pnpm`     | `@antfu/ni` (`ni`)   | Unified package manager commands    |
| **Run Scripts**           | `node`           | `tsx`                | Direct TypeScript execution         |

### 4. Other Available Tools

- **Interactive Tools**: `fzf` (fuzzy finder), `zoxide` (smart cd)
- **File Viewing**: `bat` (syntax highlighted cat), `delta` (better git diff)
- **System Analysis**: `dust` (disk usage), `tokei` (code statistics)

## 🎯 Decision Flow Chart

```
Question: Need to handle code-related tasks

1. Do I know the specific code location?
   ├─ Yes → Use VSCode LSP tools
   │   ├─ View definition → get_definition
   │   ├─ Find references → get_references
   │   ├─ Get types → get_hovers
   │   ├─ Check errors → get_diagnostics
   │   └─ Show code → highlight_code
   └─ No → Continue to next step

2. Do I know what to search for?
   ├─ Know specific code/function name → grep_search or rg
   ├─ Need to understand functionality/concepts → codebase_search
   ├─ Only know file name → file_search or fd
   └─ Need complex pattern matching → ast-grep

3. What operation is needed?
   ├─ Package management → ni/nr/nun
   ├─ Run scripts → tsx
   └─ Git operations → gh
```

## 📝 Real Usage Examples

### Scenario Comparisons

#### Scenario 1: Understanding Function Functionality

- ✅ **Correct**: Use `get_hovers` to get function documentation
- ❌ **Wrong**: Use `codebase_search` to search function name

#### Scenario 2: Finding Variable Usage

- ✅ **Correct**: Use `get_references` to find all references
- ❌ **Wrong**: Use `grep_search` (may have false positives)

#### Scenario 3: Installing Dependencies

- ✅ **Correct**: Use `ni` to install dependencies
- ❌ **Wrong**: Manually determine and use npm/yarn/pnpm

#### Scenario 4: Large-scale Search

- ✅ **Correct**: Use `rg` for unlimited search
- ❌ **Wrong**: Use `grep_search` (limited to 50 results)

#### Scenario 5: Code Display and Explanation

- ✅ **Correct**: Use `highlight_code` to visually highlight important code
- ❌ **Wrong**: Only describe code location through text

## 💡 Best Practices

### 1. Tool Combination Usage

```
Search tools find location → LSP tools get detailed info → Terminal tools execute operations
```

### 2. Selection Strategy

- **Built-in tools first**: Fast, returns structured results
- **Terminal tools supplement**: Handle limitations of built-in tools
- **VSCode tools precise**: First choice when location is known

### 3. Performance Optimization

- Use `open_files` to batch load files, improve LSP accuracy
- Use `get_diagnostics` first when encountering errors
- Use `get_references` to assess impact before modifications
- Use `highlight_code` after code analysis to enhance user experience

### 4. Common Combinations

- **Exploration + Analysis**: `codebase_search` → `get_definition` → `get_references`
- **Error Troubleshooting**: `get_diagnostics` → `get_hovers` → `grep_search`
- **Refactoring Flow**: `get_references` → `rename_symbol`
- **Code Display**: `codebase_search` → `get_definition` → `highlight_code`

## ❌ Common Mistakes

1. **Overusing search**: Still using search tools when code location is known
2. **Ignoring LSP info**: Manually analyzing code instead of using type information
3. **Wrong tool choice**: Using grep_search for tasks requiring AST
4. **Ignoring tool limitations**: Not knowing grep_search has 50 result limit
5. **Not using code highlighting**: Only describing location after finding code, not visualizing

## 🚀 Quick Reference

### Tool Selection by Task

- **View code definition** → `get_definition`
- **Find all usage** → `get_references`
- **Understand code types** → `get_hovers` / `get_signature_help`
- **Check errors/warnings** → `get_diagnostics`
- **Highlight code** → `highlight_code`
- **Search code concepts** → `codebase_search`
- **Exact text matching** → `grep_search` or `rg`
- **Find file paths** → `file_search` or `fd`
- **Install dependencies** → `ni`
- **Run TS files** → `tsx`
