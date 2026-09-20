/** Shared tint ramp for the 12-week heatmap only (Calendar's own day cells
 *  now use a solid progress fill instead — see MonthlyCalendar.tsx). */
export function intensityColor(pct: number, ring: string): string {
  if (pct <= 0) return 'var(--surface-2)';
  // Perceptual ramp (sqrt) so partial completion is visible early, not just near 100%.
  const a = 0.22 + Math.sqrt(Math.min(pct, 100) / 100) * 0.58;
  return `rgba(${ring},${a.toFixed(2)})`;
}
