
import { CleaningWeek, Person } from '../types';

const rotationPattern: Record<string, Person[]> = {
  cucina: ['Martina', 'Shapa', 'Mattia'], // Mariana esclusa
  cestino: ['Martina', 'Shapa', 'Mattia'], // Mariana esclusa
  bagno1: ['Martina', 'Mattia', 'Martina', 'Mattia'],
  bagno2: ['Shapa', 'Mariana', 'Shapa', 'Mariana'],
  ingressoLavanderia: ['Mattia', 'Martina', 'Mariana', 'Shapa']
};

export const generateCalendar = (): CleaningWeek[] => {
  const weeks: CleaningWeek[] = [];
  // CRITICAL: This date MUST remain fixed to ensure deterministic rotations.
  // Changing this date will shift all future assignments.
  let currentStart = new Date(2025, 11, 29);

  for (let i = 0; i < 105; i++) {
    const weekId = i + 1;
    const endDate = new Date(currentStart);
    endDate.setDate(currentStart.getDate() + 6);
    endDate.setHours(23, 59, 59);

    weeks.push({
      id: weekId,
      startDate: new Date(currentStart),
      endDate: new Date(endDate),
      cucina: rotationPattern.cucina[i % rotationPattern.cucina.length],
      cestino: rotationPattern.cestino[i % rotationPattern.cestino.length],
      bagno1: rotationPattern.bagno1[i % rotationPattern.bagno1.length],
      bagno2: rotationPattern.bagno2[i % rotationPattern.bagno2.length],
      ingressoLavanderia: rotationPattern.ingressoLavanderia[i % rotationPattern.ingressoLavanderia.length],
    });

    currentStart.setDate(currentStart.getDate() + 7);
  }
  return weeks;
};

export const isCurrentWeek = (start: Date, end: Date): boolean => {
  const now = new Date();
  return now >= start && now <= end;
};

export const formatDateRange = (start: Date, end: Date, lang: 'it' | 'en' = 'it'): string => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const locale = lang === 'it' ? 'it-IT' : 'en-US';
  const displayYear = end.getFullYear();

  return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)} ${displayYear}`;
};
