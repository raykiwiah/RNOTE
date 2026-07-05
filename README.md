<div align="center">

# 🟣 RNOTE — your Personal Life OS

**Private. Offline-first. AI-optional. Yours.**

Notes, databases, boards, galleries, calendar, journaling energy and a time machine —
in one beautiful app that works entirely on your device.

**[✨ Open RNOTE →](https://raykiwiah.github.io/RNOTE/)**

*No account. No cloud. No lock-in. Installable as an app (PWA), works fully offline.*

</div>

---

## Two personalities, one app

Pick how RNOTE **feels** — switch anytime, it never changes what it can do:

| 🎨 **Gen Z** | 🧘 **Millennial** |
| --- | --- |
| Vibrant gradients, springy motion, gamified | Calm, minimal, focus-first |

## Highlights

- 📝 **A real block editor** — headings, tasks, toggles, callouts, quotes, code, images, links; `/` commands and a `⌘K` palette for everything.
- 🗂️ **Databases, three ways** — typed columns (text · number · select · date · checkbox) with sort + filter, viewable as a **Table**, a drag-and-drop **Board** (kanban), or a visual **Gallery** — three lenses over the same rows, saved per page.
- 🌐 **Online / Offline — your call** — a one-tap switch. **Offline is a hard guarantee**: zero network calls, everything stays on-device. Lose your connection while Online? RNOTE auto-drops to local-only and resumes when you're back.
- 🤖 **AI that's opt-in and bring-your-own** — paste an API key (Anthropic, OpenAI, Gemini, OpenRouter) **or** sign in with your own account via OpenRouter's secure page (Google/GitHub/email) and spend your own credits across Claude, GPT, Gemini and more. Off by default; nothing is ever sent until you turn it on.
- 🪄 **Auto-organization** — notes file themselves into Smart Collections (category, project, people, tags) using free offline heuristics; sharper with AI enabled.
- 📅 **Bring-your-own calendar** — subscribe to `.ics` links or import files; today's agenda on Home with local reminders.
- 🕰️ **Time Machine** — a living timeline of everything you've done, with month recaps.
- 🏆 **Gamification** — XP, levels, streaks and achievements (Gen Z mode turns the confetti up).
- 📦 **Your data, portable** — one-click JSON backup/export, Markdown export, full import.
- 🔐 **Hardened** — strict Content-Security-Policy and render-time URL sanitization guard against stored-XSS, even from imported backups.

## Privacy, in plain words

Everything lives in your browser (IndexedDB) on your device. There is no server, no telemetry, no account. The only network calls RNOTE can ever make are the ones **you** enable: your AI provider (with your key/account) and your calendar feeds — and only while you're in Online mode.

## Under the hood

Clean architecture with a pure domain core: `domain → application ← infrastructure`, React/Zustand presentation, one composition root. TypeScript strict, Vite, Tailwind, Tiptap/ProseMirror, Dexie, FlexSearch, Framer Motion. PWA with auto-updating offline cache. 100+ unit tests plus end-to-end suites (including a malicious-backup security check and a real network-drop test) run against every change.

```bash
cd rnote
npm install
npm run dev        # develop
npm run test       # unit tests
npm run typecheck && npm run lint
npm run build      # production build (CI publishes to Pages automatically)
```

---

<div align="center">

Made with care — and a healthy obsession with local-first software. 💜

</div>
