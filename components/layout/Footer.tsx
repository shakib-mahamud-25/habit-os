'use client';
import { useEffect, useRef, useState } from 'react';
import { Github, Facebook, Linkedin } from 'lucide-react';

// TODO: replace these three with your real profile URLs.
const GITHUB_URL = 'https://github.com/shakib-mahamud-25/';
const FACEBOOK_URL = 'https://facebook.com/mahamud.deepto';
const LINKEDIN_URL = 'https://www.linkedin.com/in/md-shakib-mahamud/';

export function Footer() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <footer className="app-footer">
      <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="muted"
          style={{ background: 'none', border: 'none', fontSize: 12.5, cursor: 'pointer', padding: '4px 8px' }}
          aria-expanded={open}
        >
          Developed by <span style={{ fontWeight: 600, color: 'var(--text)' }}>Shakib Mahamud</span>
        </button>
        {open && (
          <div
            className="surface"
            style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
              padding: 8, display: 'flex', gap: 6, zIndex: 60, whiteSpace: 'nowrap',
            }}
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="GitHub"><Github size={16} /></a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Facebook"><Facebook size={16} /></a>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="LinkedIn"><Linkedin size={16} /></a>
          </div>
        )}
      </div>
    </footer>
  );
}
