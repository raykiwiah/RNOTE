# RNOTE Theming (Atmospheres)

RNOTE's look is driven by **four orthogonal axes** on the `<html>` element. Any
combination is valid, and each axis is applied without touching data or
behaviour — switching is instant and purely presentational.

| Axis | Attribute | Values | Set by |
| --- | --- | --- | --- |
| Theme | `data-theme` | `light` \| `dark` | user / system |
| Mode | `data-mode` | `millennial` \| `genz` | user (personality) |
| **Skin** | `data-skin` | `default` \| `odysseus` \| `avengers` \| `pantheon` | user (atmosphere) |
| **Variant** | `data-skin-variant` | a skin-specific id (an Avengers character / a Pantheon patron) | user |

Theme + Mode are the base design tokens (`theme/tokens.css`). A **skin** is an
optional atmosphere layered on top that re-imagines palette, typography,
texture, motion and language. A **variant** is a sub-palette within a skin — how
one skin becomes "many themes in one" (Avengers → a chosen Marvel character).

The names **Gen Z** and **Millennial** are product identities and never change.

## The moving parts

```
theme/tokens.css      Base tokens per theme×mode (HSL channel triples)
theme/skins.ts        Registry: every atmosphere, its availability + variants
theme/<skin>.css      A skin's token overrides + flair (scoped to [data-skin='…'])
theme/lexicon.ts      Skin-aware microcopy (default required, per-skin optional)
theme/variantTypes.ts Shared VariantCharacter type + the token-key superset
theme/<skin>Roster.ts Variant palettes/voice as data (avengersRoster, greekRoster)
theme/variants.ts     Generic registry for variant skins (roster/default/groups)
state/preferences.ts  Holds skin + skinVariant, applies everything to <html>
```

`state/preferences.ts#applyToDom` is the single writer of all four axes. It sets
the attributes and, for variant skins, applies the variant's design-token
overrides to `:root` as inline custom properties (and clears them when leaving).

## Adding a new skin (no variants)

Example: a "Cyberpunk" skin available in every mode.

1. **Register the id.** Add `'cyberpunk'` to `SkinName` in `state/preferences.ts`
   and to the boot-script allow-list in `index.html` (see _Boot script_ below).
2. **Write the CSS.** Create `theme/cyberpunk.css`, scoped to
   `[data-skin='cyberpunk']`. Mirror the specificity of `odysseus.css`: a light
   block `[data-skin='cyberpunk']` and a dark block
   `[data-skin='cyberpunk'][data-theme='dark']`, each **fully** re-specifying the
   palette. Because these tie the highest token specificity and load after
   `tokens.css`, they win by source order for any theme/mode. Import it in
   `main.tsx` after `odysseus.css`.
3. **(Optional) Add microcopy** in `theme/lexicon.ts`. Add only the keys you want
   to change (`cyberpunk: '…'`); every other string falls back to `default`.
   Rename achievements via the `ACHIEVEMENT_*` maps + `achievementTitle`.
4. **Register the descriptor** in `theme/skins.ts`:
   ```ts
   { id: 'cyberpunk', label: 'Cyberpunk', tagline: 'Neon rain and chrome.', icon: Cpu }
   ```
That's it — the atmosphere switch, onboarding and settings all read the registry,
so the new option appears everywhere automatically. Add a test in
`tests/presentation/` asserting the default skin's copy is unchanged.

## Restricting a skin to a mode

Set `modes` on the descriptor. Avengers is Gen Z only:

```ts
{ id: 'avengers', label: 'Avengers', modes: ['genz'], … }
```

The store enforces this: `setMode` drops any skin not available in the new mode
back to `default` (and persists it), and initial load re-checks it — so a
Gen-Z-only skin can never "stick" under Millennial. The boot script mirrors the
check to avoid a first-paint flash.

## Adding a skin with variants (sub-palettes)

Variants let one skin ship many palettes (Avengers characters). A variant only
overrides a small set of **accent** design tokens as data; everything derived
(`--shadow-glow`, gradients) follows automatically because it references
`var(--primary)`/`var(--accent)`.

The variant system is generic (see `theme/variants.ts`): the store's palette
application, the lexicon's per-character voice, and the shared picker
(`components/VariantRoster.tsx`) / emblem panel (`components/VariantEmblemPanel.tsx`)
are all skin-agnostic. Avengers and Pantheon are the two variant skins today;
a third is a roster file plus one registry entry.

1. **Model the variants as data.** See `theme/avengersRoster.ts` /
   `theme/greekRoster.ts`: each entry (a `VariantCharacter` from
   `theme/variantTypes.ts`) has an id, name, alias, `group`, `signature`,
   optional `voice`, and a `vars` map of `CSS custom property → HSL channel
   triple` (e.g. `'--primary': '0 74% 47%'`). "Mood" variants may also override
   the structural tokens (`--background`, `--surface`, …) to commit to a
   backdrop; the rest just recolour accents on the skin's base canvas.
2. **Keep the clear-set complete.** `VARIANT_TOKEN_KEYS` must be the superset of
   every key any variant sets — `applyToDom` clears it before applying a variant,
   so switching never leaves colour behind (a test enforces this).
3. **Give the skin base CSS** (`theme/<skin>.css`) the neutral canvas + flair the
   variant colours ride on, using the CSS variables. A pre-hydration fallback
   (e.g. a base `--av-energy`) avoids an un-styled first paint.
4. **Register it** in `theme/variants.ts` (roster, default id, picker groups +
   copy) and add a `ThemeDescriptor` in `skins.ts` whose `variants` derive from
   the roster — which makes `themeRequiresVariant()` true.
5. **Art is per-skin, selection is generic.** Provide an emblem component and an
   effects component for the skin (see `avengers/` and `pantheon/`); the shared
   `VariantRoster` opens on `OPEN_VARIANT_ROSTER_EVENT` and reads the active
   skin's config, so the atmosphere switch / onboarding / settings need no
   changes. Selecting applies live.

## Boot script + CSP

`index.html` contains a tiny inline script that applies persisted axes before
first paint (no flash of the wrong theme). If you extend it (new skin id, variant
handling), you **must** recompute its CSP hash:

```
npm run build
python3 - <<'PY'  # or the scratch csp_check helper
import re,hashlib,base64
h=open('dist/index.html').read()
s=re.findall(r'<script>(.*?)</script>',h,re.S)[0]
print('sha256-'+base64.b64encode(hashlib.sha256(s.encode()).digest()).decode())
PY
```

Put the printed `sha256-…` into the `script-src` of the CSP `<meta>` in
`index.html`, then rebuild and confirm it matches.

## Invariants

- **Default is sacred.** The `default` skin must render byte-identically to the
  original app. Every lexicon entry's `default` value is the original string, and
  no skin CSS applies without its `[data-skin='…']` scope.
- **Never touch data.** Skins/variants are presentation only.
- **Respect accessibility.** Gate decorative motion behind
  `prefers-reduced-motion` (see the reduced-motion blocks in each skin CSS), and
  keep contrast intact when a variant overrides structural tokens.
