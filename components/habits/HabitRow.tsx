'use client';
import { Habit, Category } from '@/types';
import { resolveIcon } from '@/lib/icons';
import { HabitCheckbox } from './HabitCheckbox';

export function HabitRow({
  habit, category, done, onToggle,
}: { habit: Habit; category?: Category; done: boolean; onToggle: () => void }) {
  return (
    <div className="habit-row">
      <HabitCheckbox done={done} onToggle={onToggle} label={`Toggle ${habit.name}`} />
      <button type="button" className="habit-tap" onClick={onToggle}>
        <span className="habit-dot" style={{ background: habit.color }} />
        <span>
          <span className="habit-name">{habit.name}</span><br />
          <span className="habit-cat">{category?.name || ''}</span>
        </span>
      </button>
    </div>
  );
}
