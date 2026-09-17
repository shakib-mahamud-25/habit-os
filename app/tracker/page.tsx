'use client';
import { useMemo } from 'react';
import { Table2 } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { PageHeader } from '@/components/ui/PageHeader';
import { MonthSelector } from '@/components/layout/MonthSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { HabitGrid } from '@/components/tracker/HabitGrid';
import { activeHabits } from '@/lib/analytics';

export default function TrackerPage() {
  const { habits, monthlyPlans, activeMonth, completionIndex, toggleCompletion } = useAppData();
  const active = useMemo(() => activeHabits(habits), [habits]);

  return (
    <div className="page fade-in" style={{ maxWidth: '100%' }}>
      <PageHeader title="Tracker" subtitle="Full monthly grid" right={<MonthSelector />} />
      {active.length === 0 ? (
        <EmptyState icon={Table2} title="No habits to track yet" subtitle="Create habits from the Habits page to see them here." />
      ) : (
        <>
          <HabitGrid
            habits={active} year={activeMonth.year} month={activeMonth.month}
            index={completionIndex} monthlyPlans={monthlyPlans}
            onToggle={(date, habitId) => toggleCompletion(date, habitId)}
          />
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Tip: scroll horizontally to see the full month. Today&apos;s column is highlighted.
          </div>
        </>
      )}
    </div>
  );
}
