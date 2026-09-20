'use client';
import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useChartColors } from '@/hooks/useChartColors';
import { PageHeader } from '@/components/ui/PageHeader';
import { MonthSelector } from '@/components/layout/MonthSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar';
import { Heatmap } from '@/components/calendar/Heatmap';
import { DayDetailModal } from '@/components/calendar/DayDetailModal';
import { activeHabits } from '@/lib/analytics';

export default function CalendarPage() {
  const { habits, settings, activeMonth, completionIndex, toggleCompletion } = useAppData();
  const colors = useChartColors();
  const active = useMemo(() => activeHabits(habits), [habits]);
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="page fade-in">
      <PageHeader title="Calendar" subtitle="Daily completion at a glance" right={<MonthSelector />} />
      {active.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing to show yet" subtitle="Add habits to see daily completion here." />
      ) : (
        <>
          <MonthlyCalendar
            year={activeMonth.year} month={activeMonth.month} habits={active}
            index={completionIndex} weekStart={settings.weekStart}
            onOpenDay={setOpenDay}
          />
          <div className="surface card" style={{ marginTop: 14 }}>
            <div className="card-title">Consistency heatmap</div>
            <div className="card-sub">Last 12 weeks · overall daily completion</div>
            <Heatmap habits={active} index={completionIndex} ring={colors.ring} />
          </div>
        </>
      )}
      {openDay && (
        <DayDetailModal
          date={openDay} habits={active} index={completionIndex}
          onToggle={(date, habitId) => toggleCompletion(date, habitId)}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  );
}
