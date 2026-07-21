import { useSound } from '../state/sound';
import { usePreferences } from '../state/preferences';
import { playCue } from '@infrastructure/audio/soundscape';

/**
 * Play a themed UI cue — but only under the Odysseus skin with voyage sounds
 * enabled. Safe to call from anywhere; it reads current state imperatively so it
 * never re-renders anything.
 */
export function cue(type: 'capture' | 'achievement'): void {
  if (usePreferences.getState().skin !== 'odysseus') return;
  if (!useSound.getState().enabled) return;
  playCue(type);
}
