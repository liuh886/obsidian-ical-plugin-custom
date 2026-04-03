# Obsidian iCal Pro

把 Obsidian 里的任务导出成标准 `.ics` 日历订阅，可写入本地文件，也可同步到 GitHub Gist。

## 当前能力

- 带时间的任务导出为 `VEVENT`
- 有日期但没有时间的任务导出为 `VTODO`
- 没有日期的任务导出为 floating `VTODO`
- 支持 Day Planner 风格的日期继承
  - 标题日期继承
  - Daily Note 文件名日期继承
- 支持本地 `.ics` 文件导出和 GitHub Gist 同步
- 保留 `obsidian://` 回跳链接

## 已实现功能

- 多路径导出规则：一个路径绑定一个分类，可配置多条
- 过滤能力：
  - Tasks 全局过滤兼容
  - 标签 include / exclude
  - 分类 include / exclude
- 任务语义增强：
  - 优先级表情映射到 RFC 5545 `PRIORITY`
  - 常见 `every ...` 循环规则映射到 `RRULE`
  - `待办 / 进行中 / 已取消 / 已完成` 生命周期映射
  - 可选 `VALARM` 提醒
- 解析增强：
  - 任务下方列表、缩进内容、引用块正文抓取
  - 支持 `> - [ ] 09:00 ...` 这类 callout / blockquote 任务
  - 清洗 Obsidian / Dataview 语法，避免脏内容进入 ICS
- 可运维能力：
  - 启动自动同步
  - 定时同步
  - 同步预览：导出数、过滤数、`VEVENT` 数、`VTODO` 数
  - 分目标同步结果报告
  - 可复制的诊断包
  - 解释为什么任务被过滤、为什么降级为 `VTODO`

## 日历语义

默认在 `EventsAndTodos` 模式下：

- 有日期且有时间 -> `VEVENT`
- 有日期但无时间 -> `VTODO`
- 无日期 -> floating `VTODO`

## 兼容性

导出的 `.ics` 面向 RFC 5545 兼容客户端，包括：

- Google Calendar
- Apple Calendar
- Outlook
- Proton Calendar
- Thunderbird
- 其他支持 iCalendar 订阅的客户端

需要注意：不同客户端对 `VTODO` 的支持能力不同，Apple 生态通常比 Google Calendar 更完整。

## 快速开始

1. 通过 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 安装，仓库地址填 `liuh886/obsidian-ical-plugin-pro`
2. 打开 `iCal Pro` 设置页
3. 至少添加一条 source path rule
4. 至少启用一个输出目标：
   - 本地 `.ics` 文件
   - GitHub Gist
5. 如果启用 Gist，填写 GitHub 用户名、Gist ID、PAT，然后点击 `Validate`
6. 点击 `Sync Now`
7. 在日历客户端订阅生成的 Gist raw URL 或本地 `.ics` 文件

## 设置页结构

- `Scope & Discovery`：路径到分类的绑定规则
- `Scheduling & Alarms`：Day Planner、同步策略、多日期处理、提醒
- `Content & Filters`：标签/分类过滤、完成项过滤
- `Sync & Cloud Connectivity`：文件名、本地路径、Gist 同步、连接校验
- `Advanced & Diagnostics`：链接格式、自动同步、调试、诊断

设置页顶部状态卡现在会展示：

- 当前 readiness 状态
- 同步预览
- 最近一次分目标同步结果
- 诊断包复制按钮

## 开发命令

- `npm run build`
- `npm run typecheck`
- `npm run test:smoke`
- `npm run validate`

## 协议

MIT
