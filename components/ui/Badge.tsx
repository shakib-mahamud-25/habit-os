import { LucideIcon } from 'lucide-react';

export function Badge({ color, icon: Icon, label }: { color: string; icon?: LucideIcon; label: string }) {
  return (
    <span className="badge" style={{ background: `${color}22`, color }}>
      {Icon && <Icon size={12} />}{label}
    </span>
  );
}
