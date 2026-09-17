import { Habit, Category } from '@/types';
import { daysInMonth } from '@/lib/dates';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_health', name: 'Health', color: '#3F6B57', icon: 'BedDouble', sortOrder: 0 },
  { id: 'cat_fitness', name: 'Fitness', color: '#C4793F', icon: 'Dumbbell', sortOrder: 1 },
  { id: 'cat_growth', name: 'Growth', color: '#3F8FAE', icon: 'Brain', sortOrder: 2 },
  { id: 'cat_education', name: 'Education', color: '#8A6BAE', icon: 'GraduationCap', sortOrder: 3 },
  { id: 'cat_career', name: 'Career', color: '#B3563F', icon: 'Briefcase', sortOrder: 4 },
  { id: 'cat_creativity', name: 'Creativity', color: '#AE6B9C', icon: 'PenLine', sortOrder: 5 },
];

// Habits and default goals pulled from the user's original habit-tracker workbook.
export function buildSeedHabits(now: number): Habit[] {
  const dim = daysInMonth(new Date().getFullYear(), new Date().getMonth());
  const specs: { name: string; cat: string; goal: number; icon: string }[] = [
    { name: 'Wake up early', cat: 'cat_health', goal: dim, icon: 'Sun' },
    { name: 'Gym', cat: 'cat_fitness', goal: 12, icon: 'Dumbbell' },
    { name: 'Sleep Early', cat: 'cat_health', goal: dim, icon: 'BedDouble' },
    { name: 'Reading books', cat: 'cat_growth', goal: 20, icon: 'BookOpen' },
    { name: 'Online Class', cat: 'cat_education', goal: 8, icon: 'Monitor' },
    { name: 'Uni Class', cat: 'cat_education', goal: 20, icon: 'GraduationCap' },
    { name: 'Office', cat: 'cat_career', goal: 22, icon: 'Briefcase' },
    { name: 'Project work', cat: 'cat_career', goal: 20, icon: 'FolderKanban' },
    { name: 'LinkedIn', cat: 'cat_career', goal: 12, icon: 'Link2' },
    { name: 'Writing', cat: 'cat_creativity', goal: 12, icon: 'PenLine' },
    { name: 'Learning', cat: 'cat_growth', goal: 20, icon: 'Brain' },
  ];
  return specs.map((h, i) => ({
    id: 'habit_' + i,
    name: h.name,
    categoryId: h.cat,
    monthlyGoal: h.goal,
    active: true,
    color: DEFAULT_CATEGORIES.find((c) => c.id === h.cat)!.color,
    icon: h.icon,
    createdAt: now,
    updatedAt: now,
    sortOrder: i,
  }));
}
