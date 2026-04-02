# iCal Pro for Obsidian

[English](#english) | [中文](#chinese)

---

<a name="chinese"></a>
## 中文 - 连接 AI Agent 与现实世界的日历桥梁

**Agent 安排的工作如何既沉淀在 Obsidian Day Planner 中，又能被 Google Calendar 同步？iCal Pro！**

iCal Pro 是一款专为 **AI 驱动工作流** 设计的高性能同步引擎。它能将你在 Obsidian 笔记中记录的、或由 AI Agent 自动生成的任务，无缝桥接到 Google Calendar、Apple Calendar 等全球日历生态中。

### 🔄 数据流图示
```text
[ AI Agent ] ──(生成任务)──▶ [ Obsidian 笔记 ] 
                                     │
                               [ iCal Pro ] ──(增量索引)──▶ [ TaskIndex ]
                                     │                          │
[ 手机日历 ] ◀──(URL 订阅)─── [ GitHub Gist ] ◀──(RFC 5545)─────┘
```

### 🌟 核心优势 (Pro 特性)
- **🚀 极速增量索引 (O(1) Cache)**：针对大型知识库优化。不再全库扫描，仅在文件修改时瞬间更新。
- **🛡️ 闭环验证**：内置“Test Connection”功能，确保你的 GitHub 配置 100% 正确。
- **📝 深度上下文抓取**：智能识别任务下方的引用块、子列表，并同步到日历描述中。
- **🔗 一键回跳**：日历事件附带纯净 `obsidian://` 链接，点击即可从日历回跳到对应的笔记。

---

<a name="english"></a>
## English - The Calendar Bridge for AI-Driven Workflows

**How can tasks assigned by AI Agents stay in your Obsidian Day Planner and sync to Google Calendar simultaneously? iCal Pro!**

iCal Pro is a professional-grade synchronization engine built for scale. It bridges the gap between your local knowledge base and your global calendar ecosystem.

### 🔄 The Workflow
```text
[ AI Agent ] ──(Tasks)──▶ [ Obsidian Note ] 
                                 │
                           [ iCal Pro ] ──(Incremental Indexing)
                                 │
[ Mobile Cal ] ◀──(Sync)── [ GitHub Gist ] ◀──(RFC 5545 Compliance)
```

### 🌟 Why iCal Pro?
- **🚀 Instant Performance**: Memory-resident `TaskIndex` ensures zero lag even with 10,000+ notes.
- **🛡️ Connection Diagnostics**: Built-in "Test Connection" button to verify your GitHub Token & Gist ID instantly.
- **📝 Multi-line Descriptions**: Automatically captures rich context listed *under* your tasks.
- **🌍 Accurate Timezones**: Systematic "Floating Time" logic keeps your plans consistent globally.

---

## ⚙️ Getting Started / 快速上手

1. **Setup GitHub Sync**: Create a [Token](https://github.com/settings/tokens?type=beta) (Gist scope) and a [Gist](https://gist.github.com/).
2. **Configure**: Enter your details in Settings -> **iCal Pro**. Use the **"Test GitHub Sync"** button to verify.
3. **Subscribe**: Copy the **Subscription URL** from the status card and add it to your calendar app.

## 📄 License
MIT | Re-architected for Pro Workflows by [liuh886](https://github.com/liuh886).
