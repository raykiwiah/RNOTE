import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  ArrowRight,
  FileText,
  Sparkles,
  Clock,
  LayoutTemplate,
  CalendarDays,
  Search,
  Check,
  Zap,
} from 'lucide-react';
import type { DocumentTreeNode } from '@application/dto';
import { useWorkspace } from '../state/workspace';
import { usePreferences } from '../state/preferences';
import { cn } from '../lib/cn';
import { emit, OPEN_TEMPLATES_EVENT, OPEN_SEARCH_EVENT } from '../lib/events';
import { modLabel } from '../lib/platform';
import { StatsCard } from '../gamification/StatsCard';
import { WeekWidget } from './WeekWidget';
import { BackupNudge } from './BackupNudge';

/** The "Today" home dashboard — the default landing surface. */
export function Home(): JSX.Element {
  const tree = useWorkspace((s) => s.tree);
  const createDocument = useWorkspace((s) => s.createDocument);
  const quickCapture = useWorkspace((s) => s.quickCapture);
  const openToday = useWorkspace((s) => s.openToday);
  const open = useWorkspace((s) => s.open);
  const mode = usePreferences((s) => s.mode);
  const userName = usePreferences((s) => s.userName);

  const [capture, setCapture] = useState('');
  const [captured, setCaptured] = useState<{ inboxId: string } | null>(null);

  const flat = useMemo(() => flatten(tree), [tree]);
  const recent = useMemo(
    () => [...flat].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6),
    [flat],
  );

  const submitCapture = async (): Promise<void> => {
    const text = capture.trim();
    if (!text) return;
    setCapture('');
    const inboxId = await quickCapture(text);
    if (!inboxId) return;
    // Stay in flow: confirm quietly instead of yanking the user to a new page.
    setCaptured({ inboxId });
    setTimeout(() => setCaptured(null), 4000);
  };

  const now = new Date();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[880px] px-6 pb-24 pt-14 sm:px-10">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="-mx-2 rounded-2xl px-5 py-6 sm:px-7"
          style={{ background: 'var(--gradient-hero)' }}
        >
          <p className="text-sm font-medium text-muted-foreground">
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold tracking-tight text-foreground">
            <span>
              {greeting(now.getHours())}
              {userName && <span className="text-primary">, {userName}</span>}
            </span>
            {mode === 'genz' && <Sparkles size={22} className="text-accent" />}
          </h1>
        </motion.header>

        <BackupNudge />

        {/* Quick capture */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="rn-field mt-7 rn-panel flex items-center gap-3 p-2 pl-4 shadow-sm"
        >
          <Zap size={18} className="shrink-0 text-primary" />
          <input
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submitCapture();
            }}
            placeholder="Capture a thought, task, or idea…"
            className="h-9 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            onClick={() => void submitCapture()}
            className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110"
          >
            Capture <ArrowRight size={15} />
          </button>
        </motion.div>
        {captured && (
          <p className="mt-2 flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <Check size={14} className="text-success" /> Saved to 📥 Inbox
            <button
              type="button"
              onClick={() => void open(captured.inboxId)}
              className="font-medium text-primary hover:underline"
            >
              Open
            </button>
          </p>
        )}

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ActionCard
            icon={<Plus size={18} />}
            title="New page"
            subtitle="Start from blank"
            onClick={() => void createDocument(null)}
          />
          <ActionCard
            icon={<LayoutTemplate size={18} />}
            title="Templates"
            subtitle="Start from a layout"
            onClick={() => emit(OPEN_TEMPLATES_EVENT)}
          />
          <ActionCard
            icon={<CalendarDays size={18} />}
            title="Today's note"
            subtitle="Plan and reflect"
            onClick={() => void openToday()}
          />
          <ActionCard
            icon={<Search size={18} />}
            title="Search"
            subtitle={`Press ${modLabel('K')}`}
            onClick={() => emit(OPEN_SEARCH_EVENT)}
          />
        </div>

        {/* Progress (gamified in Gen Z, minimal in Millennial) */}
        <StatsCard />

        {/* This week — activity strip + most-touched collections */}
        <WeekWidget />

        {/* Recent */}
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock size={15} className="text-muted-foreground" />
            Jump back in
          </div>
          {recent.length === 0 ? (
            <div className="rn-panel flex flex-col items-center gap-2 px-6 py-12 text-center">
              <FileText size={26} className="text-subtle" />
              <p className="text-sm text-muted-foreground">No pages yet — capture something above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recent.map((node, i) => (
                <motion.button
                  key={node.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => void open(node.id)}
                  className="rn-panel group flex flex-col gap-1 p-4 text-left transition hover:border-border-strong hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">
                      {node.icon || <FileText size={16} className="text-subtle" />}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{node.title}</span>
                  </div>
                  {node.preview && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{node.preview}</p>
                  )}
                  <span className="mt-1 text-[11px] text-subtle">{relativeTime(node.updatedAt)}</span>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'rn-panel group flex items-center gap-3 p-3.5 text-left',
        'hover:border-border-strong hover:shadow-lg',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </motion.button>
  );
}

function greeting(hour: number): string {
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function flatten(tree: DocumentTreeNode[]): DocumentTreeNode[] {
  const out: DocumentTreeNode[] = [];
  const walk = (nodes: DocumentTreeNode[]): void => {
    for (const node of nodes) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(tree);
  return out;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
