'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function HabitCheckbox({
  done, onToggle, disabled, size = 'md', label,
}: { done: boolean; onToggle: () => void; disabled?: boolean; size?: 'md' | 'sm'; label: string }) {
  const cls = size === 'sm' ? 'mini-chk' : 'chk';
  return (
    <motion.button
      type="button"
      className={`${cls} ${done ? 'done' : ''} ${disabled ? 'future' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={done}
      aria-label={label}
      whileTap={disabled ? undefined : { scale: 0.88 }}
    >
      <Check strokeWidth={3} />
    </motion.button>
  );
}
