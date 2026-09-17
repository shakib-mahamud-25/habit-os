'use client';
import { Habit, DailyCompletion } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { HabitCheckbox } from '@/components/habits/HabitCheckbox';
import { fmtLong } from '@/lib/dates';

export function DayDetailModal({
  date, habits, index, onToggle, onClose,
}: {
  date: string; habits: Habit[]; index: Map<string, DailyCompletion>;
  onToggle: (date: string, habitId: string) => void; onClose: () => void;
}) {
  const done = habits.filter((h) => {
    const rec = index.get(`${date}__${h.id}`);
    return !!(rec && rec.completed);
  });

  return (
    <Modal title={fmtLong(date)} onClose={onClose}>
      <div className="muted" style={{ fontSize: 13, marginTop: -8, marginBottom: 10 }}>
        {done.length} / {habits.length} habits completed
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {habits.map((h) => {
          const rec = index.get(`${date}__${h.id}`);
          const isDone = !!(rec && rec.completed);
          return (
            <div key={h.id} className="habit-row" style={{ padding: '9px 6px' }}>
              <HabitCheckbox done={isDone} onToggle={() => onToggle(date, h.id)} label={h.name} />
              <button type="button" className="habit-tap" onClick={() => onToggle(date, h.id)}>
                <span className="habit-dot" style={{ background: h.color }} />
                <span className="habit-name">{h.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
