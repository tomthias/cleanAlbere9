
import { Person } from './types';

export const AREAS = [
  { id: 'cucina', label: 'Cucina', labelEn: 'Kitchen', iconName: 'Utensils' },
  { id: 'cestino', label: 'Cestino', labelEn: 'Trash Bin', iconName: 'Trash2' },
  { id: 'bagno1', label: 'Bagno 1', labelEn: 'Bathroom 1', iconName: 'Bath' },
  { id: 'bagno2', label: 'Bagno 2', labelEn: 'Bathroom 2', iconName: 'ShowerHead' },
  { id: 'ingressoLavanderia', label: 'Ingresso + Lavanderia', labelEn: 'Hall + Laundry', iconName: 'WashingMachine' },
] as const;

export const PEOPLE: Person[] = ['Mattia', 'Martina', 'Shapa', 'Mariana'];
