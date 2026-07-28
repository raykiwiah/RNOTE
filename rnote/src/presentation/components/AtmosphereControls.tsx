import { usePreferences, type SkinName } from '../state/preferences';
import { themesForMode, themeRequiresVariant } from '../theme/skins';
import { emit, OPEN_AVENGERS_ROSTER_EVENT } from '../lib/events';
import { cn } from '../lib/cn';

/**
 * Compact switch between the atmospheres available in the current presentation
 * mode (registry-driven — see theme/skins.ts). Switching is instant and purely
 * presentational. Themes that need a variant (Avengers → a character) open their
 * picker on selection.
 */
export function AtmosphereControls(): JSX.Element {
  const skin = usePreferences((s) => s.skin);
  const mode = usePreferences((s) => s.mode);
  const setSkin = usePreferences((s) => s.setSkin);
  const themes = themesForMode(mode);

  const select = (id: SkinName): void => {
    setSkin(id);
    if (themeRequiresVariant(id)) emit(OPEN_AVENGERS_ROSTER_EVENT);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Atmosphere"
      className="flex items-center rounded-md border border-border bg-background p-0.5"
    >
      {themes.map((theme) => {
        const Icon = theme.icon;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={skin === theme.id}
            onClick={() => select(theme.id)}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors',
              skin === theme.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon size={11} />}
            {theme.label}
          </button>
        );
      })}
    </div>
  );
}
