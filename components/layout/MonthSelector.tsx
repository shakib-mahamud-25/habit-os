'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { MONTHS } from '@/lib/dates';

export function MonthSelector() {
  const { activeMonth, shiftMonth } = useAppData();
  return (
    <div className="month-nav">
      <button onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
      <div className="label serif">{MONTHS[activeMonth.month]} {activeMonth.year}</div>
      <button onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={16} /></button>
    </div>
  );
}
