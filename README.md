# iCal Pro for Obsidian

[English](#english) | [中文](#chinese)

---

<a name="chinese"></a>
## 中文 - 连接 AI Agent 与现实世界的日历桥梁

**Agent 安排的工作如何既沉淀在 Obsidian Day Planner 中，又能被 Google Calendar 同步？iCal Pro！**

iCal Pro 是一款专为 **AI 驱动工作流** 设计的高性能同步引擎。它能将你在 Obsidian 笔记中记录的、或由 AI Agent 自动生成的任务，无缝桥接到 Google Calendar、Apple Calendar 等全球日历生态中。

### 🌟 核心优势 (Pro 特性)
- **🚀 极速增量索引 (O(1) Cache)**：针对大型知识库优化。不再全库扫描，仅在文件修改时瞬间更新，即使有上万篇笔记也丝滑流畅。
- **🌍 差旅级时区支持**：彻底解决跨国出行、异地差旅时的 8 小时时差偏移问题。采用“浮动时间”策略，确保日程在任何地点都准确无误。
- **📝 深度上下文抓取**：不仅仅是任务标题。它能智能识别任务下方的引用块、子列表（如航班号、MRT 转乘路线、会议摘要），并同步到日历描述中。
- **🔗 纯净链接跳转**：移除冗余参数，日历事件附带纯净 `obsidian://` 链接，点击即可从日历一键回跳到对应的笔记 block。

### 🛠️ 两种工作流模式
1. **标准模式 (Standard)**：在任何笔记中，通过 Emoji 标记日期。
   - 示例：`- [ ] 提交 CCUS 报告 📅 2026-04-02`
2. **Day Planner 模式**：深度兼容 Day Planner 插件。
   - 逻辑：任务日期继承自笔记的日期标题（如 `## 2026-04-02`），行内仅需写时间。

---

<a name="english"></a>
## English - The Calendar Bridge for AI-Driven Workflows

**How can tasks assigned by AI Agents stay in your Obsidian Day Planner and sync to Google Calendar simultaneously? iCal Pro!**

iCal Pro is a professional-grade synchronization engine built for scale. It bridges the gap between your local knowledge base and your global calendar ecosystem.

### 🌟 Why iCal Pro?
- **🚀 Instant Performance**: With our memory-resident `TaskIndex`, sync is triggered only for modified files. Your vault performance remains untouched even with 10,000+ notes.
- **🛡️ RFC 5545 Compliant**: Uses a custom `ICalBuilder` ensuring strict adherence to international calendar standards (Line folding, CRLF, and proper escaping).
- **📝 Multi-line Descriptions**: Automatically captures rich context (notes, flight details, meeting summaries) listed *under* your tasks.
- **🌍 Accurate Timezones**: Combines `X-WR-TIMEZONE` headers with floating time logic to ensure your plans stay consistent across devices and locations.

---

## ⚙️ Getting Started / 快速上手

1. **Setup GitHub Sync**: 
   - Create a **[Personal Access Token](https://github.com/settings/tokens?type=beta)** (select `Gist` scope).
   - Create a new **[Gist](https://gist.github.com/)** (even an empty one).
2. **Configure iCal Pro**:
   - Enter your **Username**, **Gist ID**, and **Token** in the plugin settings.
   - Choose your **Target Directory** (plugin supports folder autocomplete!).
3. **Subscribe**:
   - Copy the **Subscription URL** from the settings card.
   - Add it to your calendar app (e.g., Google Calendar -> Add by URL).

## 📄 License
MIT | Forked from Andrew Brereton | Re-architected for Pro Workflows by [liuh886](https://github.com/liuh886).
