
import React from 'react';
import { Person } from '../types';
import * as LucideIcons from 'lucide-react';

interface AreaCardProps {
  id: string;
  label: string;
  iconName: string;
  assignee: Person;
  isDone: boolean;
  onToggle: () => void;
  isHighlighted: boolean;
  isOverdue: boolean;
  startDate: Date;
  endDate: Date;
  lang: 'it' | 'en';
  customColor?: string;
}

export const areaSubTasks: Record<string, { it: string[], en: string[] }> = {
  cucina: {
    it: ["Piani di lavoro", "Pulire lavandino", "Fai la lavastoviglie / togli le posate", "Tavolo", "Scopa e straccio"],
    en: ["Countertops", "Clean sink", "Dishwasher / Cutlery", "Table", "Mop and broom"]
  },
  cestino: {
    it: ["Butta Umido", "Butta Plastica/Imballaggi", "Butta Carta", "Butta Indifferenziato", "Butta Vetro"],
    en: ["Organic waste", "Plastic/Packaging", "Paper", "General waste", "Glass"]
  },
  bagno1: {
    it: ["Sanitari", "Swiffer", "Straccio"],
    en: ["Sanitaryware", "Swiffer", "Mop"]
  },
  bagno2: {
    it: ["Sanitari", "Swiffer", "Straccio"],
    en: ["Sanitaryware", "Swiffer", "Mop"]
  },
  ingressoLavanderia: {
    it: ["Scopa", "Swiffer", "Straccio"],
    en: ["Broom", "Swiffer", "Mop"]
  }
};

const AreaCard: React.FC<AreaCardProps> = ({
  id,
  label,
  iconName,
  assignee,
  isDone,
  isHighlighted,
  isOverdue,
  lang,
  customColor
}) => {
  // @ts-ignore
  const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;

  const getTheme = (color: string = 'slate') => {
    return {
      text: `text-${color}-600 dark:text-${color}-400`,
      bg: `bg-${color}-50 dark:bg-${color}-900/20`,
      border: `border-${color}-100 dark:border-${color}-800/30`,
    };
  };

  const theme = getTheme(customColor);

  const labels = {
    it: { overdue: "Ritardo", ongoing: "In corso" },
    en: { overdue: "Overdue", ongoing: "Ongoing" }
  }[lang];

  return (
    <div
      className={`group relative flex flex-col p-6 rounded-[2.5rem] border-[3px] transition-all duration-500 cursor-pointer select-none
        ${isDone
          ? 'bg-slate-50 border-slate-200 opacity-60 grayscale-[0.5] dark:bg-slate-900/50 dark:border-slate-800'
          : isOverdue
            ? 'bg-white border-orange-200 shadow-2xl shadow-orange-100 scale-[1.03] dark:bg-slate-900 dark:border-orange-500/30 dark:shadow-orange-950/20'
            : isHighlighted
              ? 'bg-white border-indigo-200 shadow-2xl shadow-indigo-100 scale-[1.03] dark:bg-slate-900 dark:border-indigo-500/30 dark:shadow-indigo-950/20'
              : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xl shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-500/30 dark:shadow-none'
        }`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3 items-center">
          <div className={`p-4 rounded-2xl transition-transform duration-500 ${isDone ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500' : isOverdue ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'}`}>
            <IconComponent size={28} strokeWidth={2.2} />
          </div>
        </div>

        {isDone ? (
          <div className="bg-emerald-500 text-white rounded-full p-2 shadow-lg shadow-emerald-200 ring-4 ring-emerald-50 dark:ring-emerald-950/30">
            <LucideIcons.Check size={18} strokeWidth={4} />
          </div>
        ) : isOverdue ? (
          <div className="flex items-center gap-1.5 bg-orange-600 text-white rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-tighter shadow-lg shadow-orange-200 dark:shadow-none">
            <LucideIcons.AlertCircle size={14} />
            <span>{labels.overdue}</span>
          </div>
        ) : isHighlighted && (
          <div className="bg-indigo-600 text-white rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-tighter shadow-lg shadow-indigo-200 dark:shadow-none">
            {labels.ongoing}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className={`text-4xl font-black tracking-tighter transition-all duration-300 ${isDone ? 'text-slate-400 line-through decoration-4 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
          {label}
        </h3>
      </div>

      <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className={`text-[11px] font-black ${theme.text}`}>{assignee.toUpperCase()}</span>
        </div>
        <div className={`text-xl font-black transition-transform group-hover:translate-x-1 ${isDone ? 'text-slate-300 dark:text-slate-700' : 'text-indigo-600/80 dark:text-indigo-400'}`}>
          →
        </div>
      </div>
    </div>
  );
};

export default AreaCard;
