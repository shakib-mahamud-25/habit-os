import React from 'react';
import { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="empty-state">
      <Icon />
      <div className="t">{title}</div>
      <div className="s">{subtitle}</div>
    </div>
  );
}
