import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Search, FilePlus2, Pencil, Zap, Sparkles, Loader2 } from 'lucide-react';
import { buildChapters, periodStats, type MonthChapter, type Recap, type TimelineEvent } from '@domain/timeline';
import type { StoredOrganization } from '@application/ports/OrganizationRepository';
import { getAiProvider } from '@/composition/container';
import { makeRecapAnalyzer, makeTimelineAsk } from '@infrastructure/ai/recapAnalyzer';
import { useTimeline } from '../state/timeline';
import { useOrganization } from '../state/organization';
import { useWorkspace } from '../state/workspace';
import { useAiSettings } from '../state/aiSettings';
import { recapCacheKey, getCachedRecap, setCachedRecap } from '../lib/recapCache';
import { Chip } from '../components/Chip';

const MOOD_EMOJI: Record<Recap['mood']['overall'], string> = {
  happy: '😊',
  motivated: '💪',
  stressed: '😬',
  'burned-out': '🥵',
  creative: '🎨',
  focused: '🎯',
  mixed: '🌤️',
};

/**
 * The Time Machine — reconstruction, not search. Activity rolls up into month
 * chapters with a statistical digest (offline) and day-by-day event cards.
 */
export function TimeMachine(): JSX.Element {
  const events = useTimeline((s) => s.events);
  const byId = useOrganization((s) => s.byId);
  const open = useWorkspace((s) => s.open);
  const aiEnabled = useAiSettings((s) => s.enabled);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const ask = async (): Promise<void> => {
    const q = query.trim();
    if (!q || !aiEnabled) return; // offline: the query already filters below
    const provider = getAiProvider();
    if (!provider) return;
    setAsking(true);
    setAnswer(null);
    const digest = buildDigest('all history', events.slice(0, 60), byId);
    const today = new Date().toISOString().slice(0, 10);
    const reply = await makeTimelineAsk(provider)(q, digest, today);
    setAnswer(reply);
    setAsking(false);
  };

  const filtered = useMemo(() => {
    let list: TimelineEvent[] = events;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.title.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q));
    if (filter) list = list.filter((e) => labelsFor(byId[e.docId]).includes(filter));
    return list;
  }, [events, query, filter, byId]);

  const chapters = useMemo(() => buildChapters(filtered), [filtered]);
  const allProjects = useMemo(() => topProjects(events, byId), [events, byId]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-12 sm:px-10">
        <header className="mb-5 flex items-center gap-3">
          <span className="text-3xl leading-none">🕰️</span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Time Machine</h1>
            <p className="text-sm text-muted-foreground">Travel back through everything you’ve worked on.</p>
          </div>
        </header>

        <div className="rn-panel mb-3 flex items-center gap-2 p-2 pl-3">
          {asking ? (
            <Loader2 size={16} className="shrink-0 animate-spin text-primary" />
          ) : (
            <Search size={16} className="shrink-0 text-subtle" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void ask();
            }}
            placeholder={
              aiEnabled
                ? 'Ask your history — “What was I doing in July?” (Enter)'
                : 'Search your history — e.g. “invoice”, “Godwin”…'
            }
            className="h-8 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
        </div>

        <AnimatePresence>
          {answer && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rn-panel mb-5 flex items-start gap-2 p-3"
            >
              <Sparkles size={15} className="mt-0.5 shrink-0 text-primary" />
              <p className="flex-1 text-sm text-foreground">{answer}</p>
              <button
                type="button"
                onClick={() => setAnswer(null)}
                className="text-xs text-subtle hover:text-foreground"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {allProjects.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <Chip label="Everything" active={filter === null} onClick={() => setFilter(null)} />
            {allProjects.map((label) => (
              <Chip
                key={label}
                label={label}
                active={filter === label}
                onClick={() => setFilter((cur) => (cur === label ? null : label))}
              />
            ))}
          </div>
        )}

        {chapters.length === 0 ? (
          <div className="rn-panel flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Clock size={26} className="text-subtle" />
            <p className="text-sm text-muted-foreground">
              {events.length === 0
                ? 'Your timeline will fill in as you write, capture and edit.'
                : 'Nothing matches that filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {chapters.map((chapter) => (
              <Chapter key={chapter.key} chapter={chapter} byId={byId} onOpen={open} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chapter({
  chapter,
  byId,
  onOpen,
}: {
  chapter: MonthChapter;
  byId: Record<string, StoredOrganization>;
  onOpen: (id: string) => void;
}): JSX.Element {
  const aiEnabled = useAiSettings((s) => s.enabled);
  const chapterEvents = useMemo(() => chapter.days.flatMap((d) => d.events), [chapter]);
  const stats = useMemo(() => periodStats(chapterEvents), [chapterEvents]);
  const labels = useMemo(() => chapterLabels(chapter, byId), [chapter, byId]);
  const maxPerDay = Math.max(1, ...Object.values(stats.perDay));

  const digest = useMemo(() => buildDigest(chapter.label, chapterEvents, byId), [chapter.label, chapterEvents, byId]);
  const cacheKey = recapCacheKey(chapter.key, digest);
  const [recap, setRecap] = useState<Recap | null>(() => getCachedRecap(cacheKey));
  const [loading, setLoading] = useState(false);
  useEffect(() => setRecap(getCachedRecap(cacheKey)), [cacheKey]);

  const generate = async (): Promise<void> => {
    const provider = getAiProvider();
    if (!provider) return;
    setLoading(true);
    const result = await makeRecapAnalyzer(provider)(chapter.label, digest);
    if (result) {
      setCachedRecap(cacheKey, result);
      setRecap(result);
    }
    setLoading(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="rn-panel mb-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">{chapter.label}</h2>
          <span className="text-xs text-muted-foreground">{chapter.total} events · {stats.activeDays} active days</span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles size={13} className="text-primary" />
          You created {stats.created}, edited {stats.edited} and captured {stats.captured}
          {labels.categories.length > 0 && <> · mostly around {labels.categories.slice(0, 3).join(', ')}</>}.
        </p>
        {/* Per-day activity strip */}
        <div className="mt-3 flex items-end gap-0.5" aria-hidden>
          {Object.entries(stats.perDay)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([day, count]) => (
              <span
                key={day}
                title={`${day}: ${count}`}
                className="w-1.5 rounded-sm bg-primary/50"
                style={{ height: `${6 + (count / maxPerDay) * 22}px` }}
              />
            ))}
        </div>
        {(labels.categories.length > 0 || labels.people.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {labels.categories.map((c) => (
              <span key={c} className="rounded-full bg-surface-hover px-2 py-0.5 text-[11px] text-muted-foreground">{c}</span>
            ))}
            {labels.people.map((p) => (
              <span key={p} className="rounded-full bg-surface-hover px-2 py-0.5 text-[11px] text-muted-foreground">🧑 {p}</span>
            ))}
          </div>
        )}

        {aiEnabled && (
          <div className="mt-3 border-t border-border pt-3">
            {recap ? (
              <RecapView recap={recap} />
            ) : (
              <button
                type="button"
                onClick={() => void generate()}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium text-primary transition hover:underline disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {loading ? 'Writing your recap…' : 'Generate AI recap'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 border-l border-border pl-4">
        {chapter.days.map((day) => (
          <div key={day.key}>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-subtle">
              {formatDay(day.date)}
            </div>
            <div className="space-y-1.5">
              {day.events.map((event) => (
                <button
                  key={event.id ?? `${event.docId}-${event.at}`}
                  type="button"
                  onClick={() => onOpen(event.docId)}
                  className="rn-panel flex w-full items-start gap-2.5 p-2.5 text-left transition hover:border-border-strong"
                >
                  <span className="mt-0.5 text-muted-foreground">{kindIcon(event.kind)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {kindVerb(event.kind)} {event.title}
                    </span>
                    {event.snippet && (
                      <span className="line-clamp-1 text-xs text-muted-foreground">{event.snippet}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-[11px] text-subtle">{formatTime(event.at)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function RecapView({ recap }: { recap: Recap }): JSX.Element {
  const section = (title: string, items: string[]): JSX.Element | null =>
    items.length === 0 ? null : (
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{title}</div>
        <ul className="mt-0.5 list-inside list-disc text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">{MOOD_EMOJI[recap.mood.overall]}</span>
        <span className="font-medium capitalize text-foreground">{recap.mood.overall}</span>
        {recap.mood.note && <span className="text-muted-foreground">· {recap.mood.note}</span>}
      </div>
      {section('Focused on', recap.focus)}
      {section('Highlights', recap.highlights)}
      {section('Open loops', recap.openLoops)}
    </div>
  );
}

function buildDigest(
  label: string,
  events: TimelineEvent[],
  byId: Record<string, StoredOrganization>,
): string {
  const stats = periodStats(events);
  const cat = new Map<string, number>();
  const ppl = new Map<string, number>();
  for (const event of events) {
    const org = byId[event.docId];
    if (!org) continue;
    org.categories.forEach((c) => cat.set(c, (cat.get(c) ?? 0) + 1));
    org.people.forEach((p) => ppl.set(p, (ppl.get(p) ?? 0) + 1));
  }
  const top = (m: Map<string, number>): string =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l]) => l).join(', ') || 'none';
  const lines = events
    .slice(0, 24)
    .map((e) => `- ${e.kind} "${e.title}": ${e.snippet}`.slice(0, 140))
    .join('\n');
  return `Period: ${label}. Created ${stats.created}, edited ${stats.edited}, captured ${stats.captured} over ${stats.activeDays} active days. Top categories: ${top(cat)}. Top people: ${top(ppl)}.\nEvents:\n${lines}`;
}

function labelsFor(org: StoredOrganization | undefined): string[] {
  return org ? [...org.projects, ...org.people] : [];
}

function topProjects(events: TimelineEvent[], byId: Record<string, StoredOrganization>): string[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    for (const label of labelsFor(byId[event.docId])) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l]) => l);
}

function chapterLabels(
  chapter: MonthChapter,
  byId: Record<string, StoredOrganization>,
): { categories: string[]; people: string[] } {
  const cat = new Map<string, number>();
  const ppl = new Map<string, number>();
  for (const day of chapter.days) {
    for (const event of day.events) {
      const org = byId[event.docId];
      if (!org) continue;
      org.categories.forEach((c) => cat.set(c, (cat.get(c) ?? 0) + 1));
      org.people.forEach((p) => ppl.set(p, (ppl.get(p) ?? 0) + 1));
    }
  }
  const top = (m: Map<string, number>): string[] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l]) => l);
  return { categories: top(cat), people: top(ppl) };
}

function kindIcon(kind: TimelineEvent['kind']): JSX.Element {
  if (kind === 'created') return <FilePlus2 size={15} />;
  if (kind === 'captured') return <Zap size={15} />;
  return <Pencil size={15} />;
}
function kindVerb(kind: TimelineEvent['kind']): string {
  if (kind === 'created') return 'Created';
  if (kind === 'captured') return 'Captured in';
  return 'Edited';
}
function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
