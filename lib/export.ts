import { Habit, Category, DailyCompletion, MonthlyPlan, MonthlyReflection, Settings, BackupPayload } from '@/types';
import { pad2 } from './dates';

export function buildBackupPayload(data: {
  habits: Habit[]; categories: Category[]; completions: DailyCompletion[];
  monthlyPlans: MonthlyPlan[]; reflections: MonthlyReflection[]; settings: Settings;
}): BackupPayload {
  return { version: 1, exportedAt: new Date().toISOString(), ...data };
}

export function downloadJSON(payload: BackupPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  a.href = url;
  a.download = `habit-os-backup-${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCSV(habits: Habit[], categories: Category[], completions: DailyCompletion[]) {
  const rows: string[][] = [['date', 'habit', 'category', 'completed']];
  for (const c of completions) {
    if (!c.completed) continue;
    const h = habits.find((h) => h.id === c.habitId);
    if (!h) continue;
    const cat = categories.find((cat) => cat.id === h.categoryId);
    rows.push([c.date, h.name, cat ? cat.name : '', 'true']);
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'habit-os-history.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function validateBackupPayload(data: unknown): data is BackupPayload {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d.habits) && Array.isArray(d.completions) && Array.isArray(d.categories);
}
