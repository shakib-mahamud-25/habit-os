'use client';
import { useEffect } from 'react';
import { useAppData } from '@/hooks/useAppData';

/** Applies the user's theme preference to <html data-theme="..."> so
 *  globals.css's light/dark tokens take effect app-wide. */
export function ThemeSync() {
  const { settings } = useAppData();
  useEffect(() => {
    const root = document.documentElement;
    if (!settings || settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings]);
  return null;
}
