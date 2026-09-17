'use client';
import { useEffect, useState } from 'react';

export interface ChartColors { text: string; grid: string; accent: string; ring: string; }

const FALLBACK: ChartColors = { text: '#79756B', grid: '#E4E1D6', accent: '#3F6B57', ring: '63,107,87' };

function readColors(): ChartColors {
  if (typeof window === 'undefined') return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue('--muted').trim() || FALLBACK.text,
    grid: styles.getPropertyValue('--border').trim() || FALLBACK.grid,
    accent: styles.getPropertyValue('--accent').trim() || FALLBACK.accent,
    ring: styles.getPropertyValue('--ring').trim() || FALLBACK.ring,
  };
}

/** Reads the current CSS custom properties so charts stay in sync with
 *  light/dark theme without hardcoding colors. Re-reads whenever the
 *  `data-theme` attribute on <html> changes. */
export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(FALLBACK);

  useEffect(() => {
    setColors(readColors());
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return colors;
}
