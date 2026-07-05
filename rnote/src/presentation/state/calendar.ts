import { create } from 'zustand';
import { container } from '@/composition/container';
import { isOnline } from '@infrastructure/net/connectivity';
import type { StoredCalendarEvent } from '@application/ports/CalendarRepository';

const service = container.calendar;

const SOURCES_KEY = 'rnote.calendar.sources';
const NOTIFY_KEY = 'rnote.calendar.notify';
const NOTIFIED_KEY = 'rnote.calendar.notified';
const DAY_MS = 24 * 60 * 60 * 1000;
/** Notify when an event starts within this many minutes. */
const NOTIFY_LEAD_MIN = 15;

export interface CalendarSource {
  id: string;
  name: string;
  /** Subscribed feed URL; undefined for one-off .ics file imports. */
  url?: string;
  lastSync: number;
  eventCount: number;
}

interface CalendarState {
  sources: CalendarSource[];
  /** Events within the loaded window (yesterday → +7 days). */
  events: StoredCalendarEvent[];
  notifyEnabled: boolean;
  syncing: boolean;
  error: string | null;

  load: () => Promise<void>;
  addUrlSource: (url: string) => Promise<boolean>;
  importIcsFile: (fileName: string, text: string) => Promise<boolean>;
  refreshAll: () => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  setNotifyEnabled: (on: boolean) => Promise<void>;
  /** Fire due notifications; returns how many were shown (for tests). */
  checkNotifications: () => number;
}

function readSources(): CalendarSource[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SOURCES_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as CalendarSource[]) : [];
  } catch {
    return [];
  }
}

function writeSources(sources: CalendarSource[]): void {
  try {
    localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
  } catch {
    /* storage unavailable */
  }
}

function readNotified(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

async function fetchIcs(url: string): Promise<string | null> {
  // Offline mode / no connection: don't reach the network at all.
  if (!isOnline()) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    return /BEGIN:VCALENDAR/i.test(text) ? text : null;
  } catch {
    // Most commonly CORS (Google/Outlook feeds don't allow browser reads).
    return null;
  }
}

export const useCalendar = create<CalendarState>((set, get) => ({
  sources: readSources(),
  events: [],
  notifyEnabled: (() => {
    try {
      return localStorage.getItem(NOTIFY_KEY) === '1';
    } catch {
      return false;
    }
  })(),
  syncing: false,
  error: null,

  load: async () => {
    const now = Date.now();
    set({ events: await service.eventsBetween(now - DAY_MS, now + 7 * DAY_MS) });
  },

  addUrlSource: async (url) => {
    set({ syncing: true, error: null });
    const text = await fetchIcs(url.trim());
    if (!text) {
      set({
        syncing: false,
        error:
          "Couldn't read that link (many calendars block browser access). Download the .ics and use “Import file” instead.",
      });
      return false;
    }
    const id = `cal_${Date.now().toString(36)}`;
    const name = nameFromUrl(url);
    const count = await service.syncSource(id, text);
    const sources = [...get().sources, { id, name, url: url.trim(), lastSync: Date.now(), eventCount: count }];
    writeSources(sources);
    set({ sources, syncing: false });
    await get().load();
    return true;
  },

  importIcsFile: async (fileName, text) => {
    if (!/BEGIN:VCALENDAR/i.test(text)) {
      set({ error: 'That file is not a valid calendar (.ics) file.' });
      return false;
    }
    set({ syncing: true, error: null });
    const id = `cal_${Date.now().toString(36)}`;
    const count = await service.syncSource(id, text);
    const sources = [
      ...get().sources,
      { id, name: fileName.replace(/\.ics$/i, '') || 'Imported calendar', lastSync: Date.now(), eventCount: count },
    ];
    writeSources(sources);
    set({ sources, syncing: false });
    await get().load();
    return true;
  },

  refreshAll: async () => {
    const { sources } = get();
    set({ syncing: true, error: null });
    const updated: CalendarSource[] = [];
    for (const source of sources) {
      if (!source.url) {
        updated.push(source);
        continue;
      }
      const text = await fetchIcs(source.url);
      if (text) {
        const count = await service.syncSource(source.id, text);
        updated.push({ ...source, lastSync: Date.now(), eventCount: count });
      } else {
        updated.push(source);
      }
    }
    writeSources(updated);
    set({ sources: updated, syncing: false });
    await get().load();
  },

  removeSource: async (id) => {
    await service.forgetSource(id);
    const sources = get().sources.filter((s) => s.id !== id);
    writeSources(sources);
    set({ sources });
    await get().load();
  },

  setNotifyEnabled: async (on) => {
    if (on && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        set({ notifyEnabled: false });
        return;
      }
    }
    try {
      localStorage.setItem(NOTIFY_KEY, on ? '1' : '0');
    } catch {
      /* session-only */
    }
    set({ notifyEnabled: on });
  },

  checkNotifications: () => {
    const { notifyEnabled, events } = get();
    if (!notifyEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return 0;
    }
    const now = Date.now();
    const soon = now + NOTIFY_LEAD_MIN * 60 * 1000;
    const notified = new Set(readNotified());
    let shown = 0;
    for (const event of events) {
      if (event.allDay || event.start < now || event.start > soon || notified.has(event.id)) continue;
      const at = new Date(event.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      try {
        new Notification(`⏰ ${event.title}`, {
          body: `${at}${event.location ? ` · ${event.location}` : ''}`,
        });
        notified.add(event.id);
        shown += 1;
      } catch {
        /* Notification construction can throw on some platforms */
      }
    }
    try {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified].slice(-200)));
    } catch {
      /* best-effort */
    }
    return shown;
  },
}));

function nameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('google')) return 'Google Calendar';
    if (u.hostname.includes('outlook') || u.hostname.includes('office')) return 'Outlook Calendar';
    if (u.hostname.includes('icloud')) return 'iCloud Calendar';
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'Calendar';
  }
}
