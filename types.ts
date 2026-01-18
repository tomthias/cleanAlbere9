
export type Person = 'Mattia' | 'Martina' | 'Shapa' | 'Mariana';

export interface CleaningWeek {
  id: number;
  startDate: Date;
  endDate: Date;
  cucina: Person;
  cestino: Person;
  bagno1: Person;
  bagno2: Person;
  ingressoLavanderia: Person;
}

export interface UserProgress {
  [weekId: number]: {
    [area in keyof Omit<CleaningWeek, 'id' | 'startDate' | 'endDate'>]?: boolean;
  };
}

export interface SwapRequest {
  id: string;
  week_id: number;
  area_id: string;
  original_person: Person;
  swapped_with: Person | null;
  status: 'pending' | 'accepted' | 'cancelled';
  created_at: string;
}
