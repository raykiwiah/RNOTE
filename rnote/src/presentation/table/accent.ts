/**
 * Shared accent hues for database views. Board lanes and gallery cards color by
 * the same select-option position, so a row keeps its identity across views.
 */
export const LANE_HUES = [258, 172, 24, 340, 205, 96, 46];

export function laneHue(index: number): number {
  return LANE_HUES[index % LANE_HUES.length] ?? 258;
}

/** Hue for a select value (its option position), or null when unset/unknown. */
export function accentForValue(options: readonly string[] | undefined, value: unknown): number | null {
  if (typeof value !== 'string' || !options) return null;
  const index = options.indexOf(value);
  return index === -1 ? null : laneHue(index);
}
