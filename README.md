# 🗓️ Obsidian iCal Pro: The Intelligence-First Calendar Bridge

[English](#english) | [中文](#chinese)

---

<a name="english"></a>

## 🚀 Sync Your AI-Agent Workflows from Obsidian to the World

**Stop living in silos. Bring your Obsidian Day Planner, AI-generated tasks, and deep-work notes into the global calendar ecosystem (Google, Apple, Outlook) with industrial-grade reliability.**

`iCal Pro` is not just a sync script; it's a high-performance **Synchronization Engine** designed for power users who demand zero lag, perfect formatting, and "peace of mind" scheduling.

### 🌟 Why iCal Pro? (The Pro Advantage)

- **⚡ O(1) Incremental Indexing**: Optimized for 10,000+ notes. Unlike other plugins that scan your entire vault, iCal Pro listens to file changes and updates your schedule instantly with near-zero CPU impact.
- **⏰ Smart Alarms & Priorities**: Full support for `VALARM`. Tag your tasks with `⏰ 15m` to get a mobile notification 15 minutes before. It even maps Obsidian priorities (`⏫`, `🔼`, `🔽`) to native calendar urgency.
- **📝 Deep Context Capture**: Synchronize more than just a title. Multi-line descriptions, sub-lists, and block quotes under your tasks are intelligently captured and synced to your calendar's "Notes" field.
- **🌍 Timezone Intelligence**: Built-in "Floating Time" logic and RFC 5545 compliance ensure your schedule stays consistent, whether you're at home or crossing timezones.
- **🔗 Seamless Backlinks**: Every calendar event includes a clean `obsidian://` URI. One tap on your phone takes you directly back to the specific note in Obsidian.

### 🔄 The Intelligence-First Workflow

```text
[ 🤖 AI Agent ] ────▶ [ 📝 Obsidian Note ] ────▶ [ 🚀 iCal Pro Engine ]
      │                     (Day Planner)                │
      │                                            (Incremental Index)
      ▼                                                  │
[ 📱 Mobile Cal ] ◀─── (Subscription URL) ──── [ ☁️ GitHub Gist ]
```

---

<a name="chinese"></a>

## 🚀 连接 AI 智能体与物理世界的日历枢纽

**别让你的计划困在笔记里。将 Obsidian Day Planner、AI 自动生成的任务以及深度工作笔记，以工业级的稳定性无缝桥接到全球日历生态（Google, Apple, Outlook）。**

`iCal Pro` 不仅仅是一个同步脚本，它是一个专为追求零延迟、完美格式和“掌控感”的高级用户打造的 **高性能同步引擎**。

### 🌟 为什么选择 Pro 版本？

- **⚡ O(1) 极速增量索引**：针对万级笔记量深度优化。不同于传统全库扫描，iCal Pro 通过监听文件事件实现毫秒级增量更新，几乎不占用系统资源。
- **⏰ 智能闹钟与优先级**：全面支持 `VALARM`。在 Markdown 中标记 `⏰ 15m`，手机日历将准时弹出提醒。同时支持将 Obsidian 优先级（`⏫`, `🔼`, `🔽`）映射为日历原生优先级。
- **📝 深度上下文抓取**：同步的不只是标题。任务下方的多行描述、子列表、引用块都会被智能识别并同步到日历的“备注”详情中。
- **🌍 全球时区智能适配**：严格遵循 RFC 5545 标准，内置“浮动时间”逻辑，确保无论你在家还是跨时区出差，日程永远精准对齐。
- **🔗 一键反向跳转**：每个日历事件都附带纯净的 `obsidian://` 链接。在手机上点击日历，瞬间回跳到 Obsidian 对应的笔记页面。

---

## 🛠️ Setup Guide / 快速上手

Setting up iCal Pro is designed to be a "one-and-done" process.

### 1. GitHub Gist Preparation (The "Cloud Bridge")
iCal Pro uses a private GitHub Gist to host your calendar file securely.
1. **Generate a Token**: Go to [GitHub Tokens](https://github.com/settings/tokens?type=beta) and create a token with the `Gist` scope.
2. **Create a Gist**: Create a new secret Gist at [gist.github.com](https://gist.github.com/) (you can leave it empty). Copy the **Gist ID** from the URL.

### 2. Configure iCal Pro
1. Install the plugin and go to **Settings -> iCal Pro**.
2. Enter your **GitHub Token** and **Gist ID**.
3. Use the **"Test GitHub Sync"** button. If it turns green, you're connected!
4. Click **"Save Calendar"** in the Command Palette to perform your first sync.

### 3. Subscribe on Your Device
1. Copy the **Subscription URL** (the link to the `obsidian.ics` file in your Gist).
2. **Google Calendar**: Add by URL in settings.
3. **Apple/iOS**: Settings -> Calendar -> Accounts -> Add Account -> Other -> Add Subscribed Calendar.

---

## 💎 Technical Moats / 技术壁垒

| Feature | Standard Plugins | iCal Pro |
| :--- | :---: | :---: |
| **Performance** | O(N) Scan (Slow) | **O(1) Incremental (Instant)** |
| **Compliance** | Basic String Concatenation | **Strict RFC 5545 (ICalBuilder)** |
| **Rich Content** | Title Only | **Multi-line Descriptions** |
| **Alarms** | No Support | **Native VALARM (⏰)** |
| **Verification** | Blind Sync | **Built-in Diagnostic Suite** |

---

## 📄 License & Attribution
MIT | Built with ❤️ for the Obsidian Community.
Original logic by Andrew Brereton. Re-architected for Pro Workflows by [liuh886](https://github.com/liuh886).
