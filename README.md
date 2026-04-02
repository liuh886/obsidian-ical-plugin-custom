# Obsidian iCal Plugin Pro

A highly performant, standard-compliant iCalendar (.ics) synchronization plugin for Obsidian. 

Seamlessly turn your Obsidian tasks into calendar events that perfectly sync with **Google Calendar, Apple Calendar, and Outlook**—without sacrificing your privacy or your vault's performance.

**Forked and modernized from the original [obsidian-ical-plugin](https://github.com/andrewbrereton/obsidian-ical-plugin) by Andrew Brereton.**

---

## 🌟 Why "Pro"? (Core Features)

This "Pro" version was completely re-architected to address the pain points of power users and professionals with massive vaults:

1. **🚀 Incremental Indexing (O(1) Cache)**
   - *The Problem:* The original plugin scanned your entire vault every time it generated a calendar, causing severe lag and freezing on large vaults.
   - *The Pro Solution:* Uses a memory-resident `TaskIndex` that listens to Obsidian's native file modification events. It only updates the tasks of the file you just edited. Generating the `.ics` is now instantaneous, even with 10,000+ files.

2. **🌍 Timezone Awareness & "Floating Time"**
   - Generates dates in standard "Floating Time" (local time) and embeds the `X-WR-TIMEZONE` header matching your system.
   - No more tasks unexpectedly shifting by 8 hours when imported into Google Calendar!

3. **📝 Multi-line Task Descriptions**
   - Going beyond the single line `- [ ] Task`.
   - Any quotes (`>`), lists (`-`, `*`), or indented text immediately following a task will be intelligently captured and injected into the calendar event's `DESCRIPTION`. 
   - Perfect for attaching flight details, MRT routes, or meeting notes directly beneath your task.

4. **🔗 Clean Links & RFC 5545 Compliance**
   - Removed the deprecated `ALTREP` parameter that broke links in Google Calendar.
   - `obsidian://` deep links are now safely placed in the `LOCATION` and `DESCRIPTION` fields, ensuring you can click straight from your phone's calendar back into your Obsidian vault.
   - Uses an industrial-grade `ICalBuilder` to ensure strict RFC 5545 compliance (75-character line folding, CRLF, strict escaping).

---

## 🛠️ Setup & Usage

### 1. Installation
*(Currently in Beta - Manual Installation)*
1. Download the latest release from the [Releases](https://github.com/liuh886/obsidian-ical-plugin-pro/releases) page.
2. Unzip the contents (`main.js`, `manifest.json`, `styles.css`) into your `<vault>/.obsidian/plugins/obsidian-ical-plugin-pro/` folder.
3. Reload Obsidian and enable the plugin in **Community Plugins**.

### 2. Configuration
Go to the plugin settings in Obsidian:
- **Target Directory:** Choose a specific folder (e.g., `100_Logs/daily`) to scan for tasks, or leave as `/` for the whole vault.
- **Save Destinations:** Choose whether to save the `.ics` file to your local disk or sync it automatically to a GitHub Gist.
- **Multiple Dates Priority:** If a task has a Start (`🛫`), Scheduled (`⏳`), and Due (`📅`) date, choose which one takes priority, or generate multiple events.

### 3. Syncing with Calendar Apps

#### Google Calendar
1. If saving to Gist: Copy the Gist URL provided in the plugin settings.
2. Go to Google Calendar on the web -> Settings -> **Add calendar** -> **From URL**.
3. Paste the URL. It will automatically fetch your tasks periodically.

#### Apple Calendar
1. Open Calendar on your Mac.
2. File -> **New Calendar Subscription...**
3. Paste your `.ics` URL or file path.

---

## 💻 For Developers

This project is built with modern TypeScript and uses `esbuild`.

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build in dev mode (watch)
npm run dev
```

## 📄 License
MIT License. Original concept and codebase by Andrew Brereton. Modernized, re-architected, and maintained by [liuh886](https://github.com/liuh886).