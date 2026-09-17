'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/hooks/useAppData';
import { useToast } from '@/components/ui/Toast';
import { Habit } from '@/types';
import { HABIT_ICON_CHOICES, resolveIcon } from '@/lib/icons';

export function HabitEditor({ habit, onClose }: { habit: Habit | null; onClose: () => void }) {
  const { categories, saveHabit } = useAppData();
  const { toast } = useToast();
  const [name, setName] = useState(habit?.name || '');
  const [categoryId, setCategoryId] = useState(habit?.categoryId || categories[0]?.id || '');
  const [monthlyGoal, setMonthlyGoal] = useState(habit?.monthlyGoal ?? 20);
  const [iconName, setIconName] = useState(habit?.icon || 'Circle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const cat = categories.find((c) => c.id === categoryId);
    const next: Habit = {
      id: habit?.id || '',
      name: trimmed,
      categoryId,
      monthlyGoal: Math.max(1, Math.min(31, Number(monthlyGoal) || 20)),
      active: habit?.active ?? true,
      color: cat?.color || habit?.color || '#3F6B57',
      icon: iconName,
      createdAt: habit?.createdAt || 0,
      updatedAt: 0,
      sortOrder: habit?.sortOrder ?? 999,
    };
    await saveHabit(next);
    toast(habit ? 'Habit updated' : 'Habit created');
    onClose();
  };

  return (
    <Modal title={habit ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label className="field-label">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Monthly goal (days)</label>
          <input type="number" min={1} max={31} value={monthlyGoal} onChange={(e) => setMonthlyGoal(Number(e.target.value))} required />
        </div>
        <div className="field">
          <label className="field-label">Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {HABIT_ICON_CHOICES.map((ic) => {
              const Icon = resolveIcon(ic);
              return (
                <button
                  type="button" key={ic}
                  className={`icon-btn ${iconName === ic ? 'sel' : ''}`}
                  onClick={() => setIconName(ic)}
                  aria-label={ic}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save habit</button>
        </div>
      </form>
    </Modal>
  );
}
