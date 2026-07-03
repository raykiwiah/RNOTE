# RNOTE — Feature Audit & Autonomous Build Roadmap

This is the **source of truth** for the autonomous build loop. Each iteration:
read this file → pick the next unchecked, unblocked task → build it to
production quality → verify (typecheck, lint, test, build, smoke) → commit &
push to `main` (auto-deploys) → tick it here → schedule the next iteration.

**Legend:** ✅ done · ◐ partial · ▷ todo · ⛔ blocked (needs access/hardware we
don't have — do the best web-only version, else document and skip).

---

## Status snapshot (audited against the master spec)

### Core principles
Offline-first ✅ · Local-first ✅ · Privacy-first ✅ · Fast ✅ · Accessible ✅ ·
Modular ✅ · Scalable ✅ · Dark mode ✅ · Responsive ◐ · Beautiful ◐ (deepen) ·
AI-optional ✅ · Bring-your-own-AI ✅ (provider port + 4 adapters + settings/consent,
off by default) · Bring-your-own-cloud ◐ (SQLite done, cloud ▷) ·
Zero lock-in ◐ (JSON+MD export ✅, more import ▷) · Extensible ▷ (plugins)

### Modes
Gen Z / Millennial selection ✅ · switch later ✅ · presentation-only ✅ ·
Gen Z: gradients ✅, motion ✅, gamification ✅, XP/streaks/achievements ✅,
anime themes ▷, AI companion ▷, widget homepage ▷, theme studio ▷, cursor fx ▷,
music ▷, Discord RPC ⛔(desktop)

### Editor & blocks
Editor ✅ · Nested pages ✅ · Blocks ✅ · Slash commands ✅ · Callouts ✅ ·
Code blocks ✅ · Toggles ✅ · Links ✅ · Task lists ✅ · Markdown shortcuts ✅ ·
Bubble menu ✅ · Columns ▷ · Tables ▷ · Images/files ▷ · Bookmarks ▷ ·
Embeds ▷ · Equations ▷ · Synced blocks ▷ · Block drag-handle ▷ · Version history ▷

### Databases & views
Databases ▷ · Relations ▷ · Rollups ▷ · Formula engine ▷ · Table ▷ · Kanban ▷ ·
Gallery ▷ · Calendar ▷ · Timeline ▷ · Charts ▷

### Life-OS modules
Journal ▷ · Prayer journal ▷ · Dream journal ▷ · Mood tracker ▷ · Habit tracker ▷ ·
Finance/Expense/Budget/Subscription/Loan ▷ · Health/Fitness ▷ · Goals ▷ ·
Travel planner ▷ · Recipe manager ▷ · Reading/Movie trackers ▷ · Project mgmt ▷

### Productivity surfaces
Quick capture ✅ · Focus mode ✅ · Reading mode ✅ · Study mode ▷ · Flashcards ▷ ·
Adaptive dashboard / widget homepage ▷ · Templates ✅

### Search / data / shortcuts
Local + global search ✅ (⌘K) · Keyboard shortcuts ◐ (⌘K/⌘\/⌘., platform-correct
labels) · Export ✅ · Import ◐ · Version history ▷

### AI (bring-your-own)
Provider foundation ✅ (AiProvider port; Anthropic/OpenAI/Gemini/OpenRouter fetch
adapters; Settings with consent, Test connection; off by default; graceful null
path) · AI assistant ▷ · AI chat with notes ▷ · Auto-organization ◐ (Upgrade 2 · B —
offline heuristics + VO + Dexie persistence + auto-file-on-save + Smart Collections
sidebar/views + editable organization bar ✅; AI extraction + corrections ▷) ·
Time Machine ▷ (Upgrade 2 · C) · Adaptive AI ▷ · AI companion ▷ ·
OCR ⛔(needs model) · Voice notes ◐(Web Speech API possible) · Meeting notes ▷ ·
PDF annotate/summarize ▷ · Document scanner ⛔(camera/native)

### Platform / extensibility
Tauri desktop + SQLite ✅(scaffold) · Cloud storage adapters ▷ · Plugin system ▷ ·
Theme studio ▷ · Widget studio ▷ · Marketplace ▷ · PWA installable ✅

---

## Build backlog (execute top-to-bottom)

> Each item is one shippable loop iteration. Keep every push green and deployed.

- [x] **I1 · Home dashboard + UI overhaul.** ✅ Widget "Today" home: time-aware
      greeting, quick-capture, quick-action cards, and a "Jump back in" recent
      grid. Home view wired into shell/sidebar/topbar; lands here on boot.
- [x] **I2 · Templates gallery.** ✅ Template picker (Blank, Daily note, Journal,
      Meeting notes, Habit tracker, Reading list, Project, Goal) with seeded rich
      content; create-with-content use case; opened from Home + ⌘K.
- [◐] **I3 · Block expansion.** ✅ Image block (inline data-URL, offline-safe,
      exports to Markdown). ▷ Remaining: columns, bookmark (URL card), table.
- [x] **I4 · Quick capture + Focus/Reading mode.** ✅ Global quick-capture
      (floating button + ⌘K) appends to an Inbox without navigating; ✅ "Today's
      note" one-click daily note; ✅ backup nudge; ✅ Focus mode (⌘. — hides all
      chrome for immersive writing) and ✅ Reading mode (read-only, relaxed
      typography), both from the topbar and ⌘K. (Also shipped here: offline
      service worker (PWA), mobile drawer sidebar, inline link editor, correct
      platform shortcut labels, bare-domain link normalization.)
- [x] **I5 · Gamification (Gen Z).** ✅ Local, persisted stats store (XP, levels
      on a triangular curve, daily streak, 6 achievements) with pure, unit-tested
      leveling logic. XP accrues from pages, captures, templates and daily
      check-ins. Gen Z: animated Home progress card (level ring, gradient XP bar,
      streak flame, badge shelf) + celebratory level-up/achievement toast.
      Millennial: identical numbers as one calm line, no motion (presentation-only).
- [ ] **I6 · Databases v1 — Table view.** A "collection" page type with typed
      properties (text/number/select/date/checkbox), add/edit rows, sort/filter.
- [ ] **I7 · Databases v2 — Board / Gallery / Calendar views** over the same
      collection model; grouping; drag between columns.
- [ ] **I8 · Trackers module.** Habit tracker + Mood tracker + Finance tracker
      built on collections + dashboard widgets.
- [ ] **I9 · Journals.** Journal / Prayer / Dream journals with calendar
      navigation and daily entries.
- [◐] **I10 · AI (bring-your-own) foundation.** ✅ Provider foundation shipped
      (Upgrade 2 · Phase A): `AiProvider` port; Anthropic/OpenAI/Gemini/OpenRouter
      `fetch` adapters (no SDKs); Settings modal with consent, provider/model/key,
      and Test connection; keys stored locally under `rnote.ai.*`; `getAiProvider()`
      returns null when off/keyless so every path degrades gracefully; ADR 0004.
      ▷ Remaining: AI assist in the editor (improve/summarize/continue) + AI chat
      with the current page. (Auto-organization = Upgrade 2 · B; Time Machine = C.)
- [ ] **I11 · Version history** (event-sourced snapshots per page) + restore.
- [ ] **I12 · Import** (Markdown files, Notion/HTML) + richer export (per-page &
      whole-workspace Markdown, HTML).
- [ ] **I13 · Theme Studio** (custom accent/radius/wallpaper) + more presets
      incl. anime-inspired Gen Z themes; custom cursor fx.
- [ ] **I14 · Flashcards + Study mode** (spaced repetition over card blocks).
- [ ] **I15 · Widget Studio + adaptive dashboard** (user-arrangeable widgets).
- [ ] **I16 · Plugin system + Marketplace scaffold** (sandboxed extension API).
- [ ] **I17 · Canvas & charts.** Mind maps, infinite canvas/whiteboard, charts,
      equations (KaTeX), embeds.
- [ ] **I18 · Voice notes** (Web Speech API) + meeting notes; **PDF summarize/
      annotate** (pdf.js). OCR/document-scanner ⛔ unless a web model is viable.
- [ ] **I19 · Cloud storage adapters** (Drive/Dropbox/OneDrive/folder via
      bring-your-own) behind the existing storage ports + optional sync.

### Blocked / needs external access (revisit or document)
- ⛔ Discord Rich Presence — desktop-only integration (post-Tauri).
- ⛔ Native document scanner / camera OCR — device/native APIs.
- ◐ Music integration — needs the user's Spotify OAuth in the deployed app.

---

## Working agreement for each iteration
1. Follow the existing Clean Architecture / DDD layering. Reuse primitives.
2. Every feature: offline, accessible, dark-mode, responsive, both modes.
3. Gate before push: `typecheck && lint && test && build` + Playwright smoke.
4. Keep `main` deployable; never leave the live site broken.
5. Update this file every iteration. Small, frequent, green pushes.
