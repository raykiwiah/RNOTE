import { usePreferences, type SkinName } from '../state/preferences';
import { characterById, type CharacterVoice } from './avengersRoster';

/**
 * Skin-aware microcopy. Under a skin the interface can speak a different
 * language — Odysseus talks like a voyage, Avengers like a mission briefing.
 *
 * Each entry requires only `default` (byte-identical to the original copy, so
 * the default skin reads exactly as before); any skin override is optional and
 * falls back to `default`. That means adding a theme only means adding the
 * strings you actually want to change.
 *
 * Only presentational strings live here; nothing here changes behaviour.
 */
type Entry = { default: string } & Partial<Record<SkinName, string>>;

const LEXICON = {
  // Sidebar navigation
  'nav.home': { default: 'Home', odysseus: 'Ithaca', avengers: 'The Tower' },
  'nav.today': { default: 'Today', odysseus: "Today's Log", avengers: 'Mission Log' },
  'nav.timeMachine': { default: 'Time Machine', odysseus: 'Voyages Past', avengers: 'Time Heist' },
  'nav.search': { default: 'Search', odysseus: 'Seek Knowledge', avengers: 'Scan' },
  'nav.newPage': { default: 'New page', odysseus: 'New Chronicle', avengers: 'New Mission' },
  'nav.private': { default: 'Private', odysseus: 'Chronicles', avengers: 'Classified' },
  'nav.trash': { default: 'Trash', odysseus: 'The Underworld', avengers: 'Snapped' },
  'nav.settings': { default: 'Settings', odysseus: 'The Temple', avengers: 'The Lab' },
  'empty.noPages': {
    default: 'No pages yet.',
    odysseus: 'Every great journey begins with a single story.',
    avengers: 'Every hero starts somewhere. Log your first mission.',
  },

  // Search / command palette
  'search.placeholder': {
    default: 'Search pages or type a command…',
    odysseus: 'Seek knowledge across your chronicles…',
    avengers: 'Scan your files, hero…',
  },

  // Home dashboard
  'home.capturePlaceholder': {
    default: 'Capture a thought, task, or idea…',
    odysseus: 'Record a thought for the voyage…',
    avengers: 'Drop some intel…',
  },
  'home.captureButton': { default: 'Capture', odysseus: 'Record', avengers: 'Log' },
  'home.recent': { default: 'Jump back in', odysseus: 'Recent Discoveries', avengers: 'Recent Missions' },
  'home.recentEmpty': {
    default: 'No pages yet — capture something above.',
    odysseus: 'The sea is calm. Your next story awaits.',
    avengers: 'All quiet on the watch. Assemble your first mission.',
  },
  'home.action.newPage.title': { default: 'New page', odysseus: 'Begin a Chronicle', avengers: 'New Mission' },
  'home.action.newPage.sub': { default: 'Start from blank', odysseus: 'A blank scroll' },
  'home.action.templates.title': { default: 'Templates', odysseus: 'Charts', avengers: 'Blueprints' },
  'home.action.templates.sub': { default: 'Start from a layout', odysseus: 'Start from a map' },
  'home.action.today.title': { default: "Today's note", odysseus: "Captain's Log", avengers: 'Mission Log' },
  'home.action.today.sub': { default: 'Plan and reflect', odysseus: 'Chart the day' },
  'home.action.search.title': { default: 'Search', odysseus: 'Seek Knowledge', avengers: 'Scan' },

  // Time-of-day greeting
  'greeting.lateNight': { default: 'Still up?', odysseus: 'Sailing by starlight', avengers: 'Still on watch?' },
  'greeting.morning': { default: 'Good morning', odysseus: 'Fair winds', avengers: 'Suit up' },
  'greeting.afternoon': { default: 'Good afternoon', odysseus: 'Calm seas', avengers: 'Stay vigilant' },
  'greeting.evening': { default: 'Good evening', odysseus: 'Safe harbour', avengers: 'Stand down, hero' },

  // Editor
  'editor.untitled': { default: 'Untitled', odysseus: 'Untitled Chronicle', avengers: 'Untitled Mission' },
  'editor.saved': { default: 'Saved locally', odysseus: 'Preserved', avengers: 'Synced to base' },
  'editor.saving': { default: 'Saving…', odysseus: 'Preserving…', avengers: 'Syncing…' },
  'editor.emptyTitle': { default: 'No page open', odysseus: 'No chronicle open', avengers: 'No mission open' },
  'editor.emptyBody': {
    default: 'Select a page from the sidebar or create a new one.',
    odysseus: 'Choose a chronicle from your log, or begin a new one.',
    avengers: 'Pick a mission from the sidebar, or start a new one.',
  },

  // Trash / The Underworld / Snapped
  'trash.title': { default: 'Trash', odysseus: 'The Underworld', avengers: 'Snapped' },
  'trash.empty': { default: 'Trash is empty', odysseus: 'The Underworld is quiet.', avengers: 'Nothing snapped.' },
  'trash.emptyHint': {
    default: 'Pages you move to Trash appear here.',
    odysseus: 'Chronicles you release drift here — not yet forgotten.',
    avengers: 'Missions you dust appear here — restorable, of course.',
  },

  // Progress — the journey home / the climb to legend
  'stats.progressLabel': { default: 'Your progress', odysseus: 'Your voyage home', avengers: 'Your rank' },
  'stats.xp': { default: 'XP', odysseus: 'wisdom' },
  'stats.toNext': { default: 'to next', odysseus: 'to Ithaca', avengers: 'to level up' },
  'stats.dayOne': { default: 'day', odysseus: 'day at sea' },
  'stats.dayMany': { default: 'days', odysseus: 'days at sea' },
  'stats.noStreak': { default: 'No streak yet', odysseus: 'Becalmed — no streak yet' },
} satisfies Record<string, Entry>;

/**
 * Renamed achievements per skin. Keyed by achievement id; the default title
 * (from the domain) is used for any id not listed here and for the default skin.
 */
const ACHIEVEMENT_ODYSSEUS: Record<string, string> = {
  'first-page': 'First Voyage',
  capturer: 'Navigator',
  prolific: 'Story Keeper',
  'streak-3': 'Steadfast Helmsman',
  'streak-7': 'Keeper of Memories',
  'level-5': 'King of Ithaca',
};

const ACHIEVEMENT_AVENGERS: Record<string, string> = {
  'first-page': 'Recruit',
  capturer: 'Field Agent',
  prolific: 'Avenger',
  'streak-3': 'On Patrol',
  'streak-7': 'Earth’s Mightiest',
  'level-5': 'Legend',
};

export function achievementTitle(id: string, fallback: string, skin: SkinName): string {
  if (skin === 'odysseus') return ACHIEVEMENT_ODYSSEUS[id] ?? fallback;
  if (skin === 'avengers') return ACHIEVEMENT_AVENGERS[id] ?? fallback;
  return fallback;
}

export type LexKey = keyof typeof LEXICON;

/** Maps a lexicon key to the Avengers character's spoken override, if any. */
function voiceFor(voice: CharacterVoice, key: LexKey): string | undefined {
  if (key.startsWith('greeting.')) return voice.greeting;
  if (key === 'home.capturePlaceholder') return voice.capture;
  if (key === 'home.captureButton') return voice.logButton;
  if (key === 'empty.noPages' || key === 'home.recentEmpty') return voice.empty;
  return undefined;
}

/**
 * Resolve a string for the active skin (and, under Avengers, the active
 * character's voice). Resolution order: character voice → skin override →
 * default.
 */
export function lex(skin: SkinName, key: LexKey, variant?: string | null): string {
  if (skin === 'avengers') {
    const voice = characterById(variant)?.voice;
    if (voice) {
      const spoken = voiceFor(voice, key);
      if (spoken !== undefined) return spoken;
    }
  }
  // `satisfies` keeps each entry's literal shape, so widen to Entry before
  // indexing by an arbitrary skin (missing overrides fall back to default).
  const entry: Entry = LEXICON[key];
  return entry[skin] ?? entry.default;
}

/** Hook returning a translator bound to the active skin (and character). */
export function useLexicon(): (key: LexKey) => string {
  const skin = usePreferences((s) => s.skin);
  const variant = usePreferences((s) => s.skinVariant);
  return (key: LexKey) => lex(skin, key, variant);
}
