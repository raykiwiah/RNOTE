import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { SlashCommand } from './commands';
import { usePreferences } from '../state/preferences';
import { cn } from '../lib/cn';

interface SlashMenuProps {
  items: SlashCommand[];
  activeIndex: number;
  position: { x: number; y: number };
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
}

const MENU_WIDTH = 300;
const MENU_MAX_HEIGHT = 320;

export function SlashMenu({
  items,
  activeIndex,
  position,
  onSelect,
  onHover,
}: SlashMenuProps): JSX.Element {
  const listRef = useRef<HTMLDivElement>(null);
  const odysseus = usePreferences((s) => s.skin) === 'odysseus';

  // Keep the highlighted item scrolled into view during keyboard navigation.
  useLayoutEffect(() => {
    const list = listRef.current;
    const active = list?.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Flip above the caret when there isn't room below.
  const spaceBelow = window.innerHeight - position.y;
  const openUp = spaceBelow < MENU_MAX_HEIGHT + 24;
  const left = Math.min(position.x, window.innerWidth - MENU_WIDTH - 16);
  const top = openUp ? undefined : position.y + 8;
  const bottom = openUp ? window.innerHeight - position.y + 20 : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: openUp ? 4 : -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      role="listbox"
      aria-label="Insert block"
      className="rn-panel fixed z-50 overflow-hidden p-1.5"
      style={{ left, top, bottom, width: MENU_WIDTH }}
    >
      <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-subtle">
        {odysseus ? 'Chronicle blocks' : 'Basic blocks'}
      </div>
      <div ref={listRef} className="max-h-[280px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</div>
        ) : (
          items.map((item, index) => {
            const Icon = item.icon;
            const active = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={active}
                onMouseEnter={() => onHover(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(index);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left',
                  'transition-colors duration-75',
                  active ? 'bg-primary/10' : 'hover:bg-surface-hover',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                    active
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-surface text-muted-foreground',
                  )}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {odysseus && item.odysseus ? item.odysseus : item.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
