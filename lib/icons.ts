import {
  Circle, BookOpen, Dumbbell, BedDouble, GraduationCap, Briefcase, FolderKanban,
  Link2, PenLine, Brain, Monitor, Star, Sun, LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Circle, BookOpen, Dumbbell, BedDouble, GraduationCap, Briefcase, FolderKanban,
  Link2, PenLine, Brain, Monitor, Star, Sun,
};

export const HABIT_ICON_CHOICES = Object.keys(ICON_MAP);

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Circle;
}
