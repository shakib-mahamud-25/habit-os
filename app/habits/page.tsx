'use client';
import { useState } from 'react';
import { Plus, Edit3, Check, X, Trash2, ListChecks } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { HabitEditor } from '@/components/habits/HabitEditor';
import { CategoryEditor } from '@/components/habits/CategoryEditor';
import { Habit, Category } from '@/types';

export default function HabitsPage() {
  const { habits, categories, setHabitActive, deleteHabit } = useAppData();
  const { toast } = useToast();
  const [editingHabit, setEditingHabit] = useState<Habit | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);

  const groups = categories.map((cat) => ({ cat, habits: habits.filter((h) => h.categoryId === cat.id) }));
  const uncategorized = habits.filter((h) => !categories.find((c) => c.id === h.categoryId));

  return (
    <div className="page fade-in">
      <PageHeader
        title="Habits" subtitle="Manage what you track"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => setEditingCategory('new')}><Plus size={15} /> Category</button>
            <button className="btn btn-primary" onClick={() => setEditingHabit('new')}><Plus size={15} /> Habit</button>
          </div>
        }
      />
      {habits.length === 0 ? (
        <EmptyState icon={ListChecks} title="Add your first habit to start building your system." subtitle="Habits are grouped by category and can be reordered any time." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((g) => (
            <div key={g.cat.id} className="surface card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: g.cat.color }} />
                  <div className="card-title" style={{ margin: 0 }}>{g.cat.name}</div>
                </div>
                <button className="icon-btn" onClick={() => setEditingCategory(g.cat)} aria-label="Edit category"><Edit3 size={15} /></button>
              </div>
              {g.habits.length === 0 ? (
                <div className="muted" style={{ fontSize: 13, padding: '6px 2px' }}>No habits in this category yet.</div>
              ) : (
                g.habits.map((h) => (
                  <HabitMgmtRow
                    key={h.id} habit={h}
                    onEdit={() => setEditingHabit(h)}
                    onToggleActive={() => { setHabitActive(h.id, !h.active); toast(h.active ? 'Habit deactivated' : 'Habit reactivated'); }}
                    onDelete={() => setDeleteTarget(h)}
                  />
                ))
              )}
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div className="surface card">
              <div className="card-title">Uncategorized</div>
              {uncategorized.map((h) => (
                <HabitMgmtRow
                  key={h.id} habit={h}
                  onEdit={() => setEditingHabit(h)}
                  onToggleActive={() => { setHabitActive(h.id, !h.active); toast(h.active ? 'Habit deactivated' : 'Habit reactivated'); }}
                  onDelete={() => setDeleteTarget(h)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {editingHabit && (
        <HabitEditor habit={editingHabit === 'new' ? null : editingHabit} onClose={() => setEditingHabit(null)} />
      )}
      {editingCategory && (
        <CategoryEditor category={editingCategory === 'new' ? null : editingCategory} onClose={() => setEditingCategory(null)} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.name}"?`}
          body="Historical records stay in your data for accuracy, but this habit will no longer appear in tracking. This can't be undone from the UI."
          confirmLabel="Delete habit"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => { await deleteHabit(deleteTarget.id); setDeleteTarget(null); toast('Habit deleted'); }}
        />
      )}
    </div>
  );
}

function HabitMgmtRow({
  habit, onEdit, onToggleActive, onDelete,
}: { habit: Habit; onEdit: () => void; onToggleActive: () => void; onDelete: () => void }) {
  return (
    <div className="habit-row" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span className="habit-dot" style={{ background: habit.color }} />
        <div style={{ minWidth: 0 }}>
          <div className="habit-name" style={habit.active ? undefined : { textDecoration: 'line-through', color: 'var(--muted)' }}>{habit.name}</div>
          <div className="habit-cat">Goal: {habit.monthlyGoal}/mo {!habit.active && '· inactive'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button className="icon-btn" onClick={onEdit} aria-label="Edit"><Edit3 size={15} /></button>
        <button className="icon-btn" onClick={onToggleActive} aria-label={habit.active ? 'Deactivate' : 'Activate'}>
          {habit.active ? <X size={15} /> : <Check size={15} />}
        </button>
        <button className="icon-btn" onClick={onDelete} aria-label="Delete"><Trash2 size={15} /></button>
      </div>
    </div>
  );
}
