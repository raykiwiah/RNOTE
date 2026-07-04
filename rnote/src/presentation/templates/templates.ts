import type { RichDoc, RichNode } from '@domain/blocks';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Built fresh on use so date-based templates reflect the current day. */
  create: () => { title: string; icon: string; content: RichDoc };
}

// ── Terse block builders ─────────────────────────────────────────────────────
const text = (value: string): RichNode => ({ type: 'text', text: value });
const p = (value = ''): RichNode => (value ? { type: 'paragraph', content: [text(value)] } : { type: 'paragraph' });
const h = (level: 1 | 2 | 3, value: string): RichNode => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
});
const bullets = (items: string[]): RichNode => ({
  type: 'bulletList',
  content: items.map((i) => ({ type: 'listItem', content: [p(i)] })),
});
const tasks = (items: string[]): RichNode => ({
  type: 'taskList',
  content: items.map((i) => ({ type: 'taskItem', attrs: { checked: false }, content: [p(i)] })),
});
const callout = (icon: string, value: string): RichNode => ({
  type: 'callout',
  attrs: { icon },
  content: [p(value)],
});
const divider = (): RichNode => ({ type: 'horizontalRule' });
const doc = (...nodes: RichNode[]): RichDoc => ({ type: 'doc', content: nodes });

const today = (): string =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** The canonical title of today's daily note (shared with the "Today" action). */
export function todayNoteTitle(): string {
  return today();
}

/** The user's saved first name (empty if not set) — used to personalise notes. */
function userName(): string {
  try {
    return localStorage.getItem('rnote.name') ?? '';
  } catch {
    return '';
  }
}

function dayGreeting(): string {
  const hour = new Date().getHours();
  const part = hour < 5 ? 'evening' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const name = userName();
  return name ? `Good ${part}, ${name} — here's your day.` : `Good ${part} — here's your day.`;
}

export const DAILY_TEMPLATE_ID = 'daily';

export const TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank page',
    description: 'Start from nothing',
    emoji: '📄',
    create: () => ({ title: '', icon: '', content: doc(p()) }),
  },
  {
    id: 'daily',
    name: 'Daily note',
    description: "Plan and reflect on your day",
    emoji: '📅',
    create: () => ({
      title: today(),
      icon: '📅',
      content: doc(
        h(1, today()),
        callout('👋', dayGreeting()),
        h(2, 'Intentions'),
        tasks(['', '', '']),
        h(2, 'Notes'),
        p(),
        h(2, 'Grateful for'),
        bullets(['']),
      ),
    }),
  },
  {
    id: 'journal',
    name: 'Journal entry',
    description: 'Free-write and reflect',
    emoji: '📓',
    create: () => ({
      title: `Journal — ${today()}`,
      icon: '📓',
      content: doc(
        h(1, 'Journal'),
        p(today()),
        h(3, 'How I feel'),
        p(),
        h(3, 'What happened'),
        p(),
        h(3, 'Grateful for'),
        bullets(['', '']),
      ),
    }),
  },
  {
    id: 'meeting',
    name: 'Meeting notes',
    description: 'Agenda, notes, action items',
    emoji: '🗓️',
    create: () => ({
      title: 'Meeting notes',
      icon: '🗓️',
      content: doc(
        h(1, 'Meeting notes'),
        p(today()),
        h(3, 'Attendees'),
        bullets(['']),
        h(3, 'Agenda'),
        bullets(['']),
        h(3, 'Notes'),
        p(),
        h(3, 'Action items'),
        tasks(['']),
      ),
    }),
  },
  {
    id: 'habit',
    name: 'Habit tracker',
    description: 'Build daily habits',
    emoji: '✅',
    create: () => ({
      title: 'Habit tracker',
      icon: '✅',
      content: doc(
        h(1, 'Habits'),
        callout('💡', 'Check off each habit as you complete it. Consistency beats intensity.'),
        tasks(['Drink water', 'Move for 30 minutes', 'Read', 'Sleep by 11pm']),
      ),
    }),
  },
  {
    id: 'reading',
    name: 'Reading list',
    description: 'Track what you read',
    emoji: '📚',
    create: () => ({
      title: 'Reading list',
      icon: '📚',
      content: doc(
        h(1, 'Reading list'),
        h(3, 'To read'),
        tasks(['', '']),
        h(3, 'Reading now'),
        tasks(['']),
        h(3, 'Finished'),
        tasks([]),
      ),
    }),
  },
  {
    id: 'project',
    name: 'Project',
    description: 'Plan and track a project',
    emoji: '🚀',
    create: () => ({
      title: 'Project',
      icon: '🚀',
      content: doc(
        h(1, 'Project'),
        h(2, 'Overview'),
        p(),
        h(2, 'Goals'),
        bullets(['']),
        h(2, 'Milestones'),
        tasks(['', '']),
        divider(),
        h(2, 'Notes'),
        p(),
      ),
    }),
  },
  {
    id: 'goal',
    name: 'Goal',
    description: 'Define and break down a goal',
    emoji: '🎯',
    create: () => ({
      title: 'Goal',
      icon: '🎯',
      content: doc(
        h(1, 'Goal'),
        callout('🎯', 'What do you want to achieve, and by when?'),
        h(3, 'Why it matters'),
        p(),
        h(3, 'Steps'),
        tasks(['', '', '']),
      ),
    }),
  },
];
