
import { CleaningWeek, Person } from '../types';

// Rotazioni randomizzate a partire dal 9 febbraio 2025
// Mariana esclusa da cucina e cestino
// Bagni separati: bagno1 = Martina/Mattia, bagno2 = Shapa/Mariana
const rotationPattern: Record<string, Person[]> = {
  cucina: ['Shapa', 'Mattia', 'Martina'], // Mariana esclusa
  cestino: ['Mattia', 'Martina', 'Shapa'], // Mariana esclusa
  bagno1: ['Mattia', 'Martina'], // Solo Mattia e Martina
  bagno2: ['Shapa', 'Mariana'], // Solo Shapa e Mariana
  ingressoLavanderia: ['Martina', 'Mariana', 'Shapa', 'Mattia']
};

export const generateCalendar = (): CleaningWeek[] => {
  const weeks: CleaningWeek[] = [];
  // Data di inizio: 9 febbraio 2025 (domenica)
  let currentStart = new Date(2025, 1, 9);

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
