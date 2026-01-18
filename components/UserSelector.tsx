import React from 'react';
import { Person } from '../types';
import { PEOPLE } from '../constants';
import { useUser } from './UserContext';
import { User, Check } from 'lucide-react';

interface UserSelectorProps {
    onSelect?: () => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onSelect }) => {
    const { currentUser, setCurrentUser, isLoading } = useUser();

    const handleSelect = (person: Person) => {
        setCurrentUser(person);
        if (onSelect) onSelect();
    };

    // Non mostrare nulla durante il caricamento iniziale (evita flash)
    if (isLoading) return null;
    if (currentUser && !onSelect) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 touch-none" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 text-center">
                    <div className="mx-auto w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                        <User size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Chi sei?</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-10">Seleziona il tuo nome per sincronizzare le pulizie</p>

                    <div className="grid grid-cols-2 gap-4">
                        {PEOPLE.map((person) => (
                            <button
                                key={person}
                                onClick={() => handleSelect(person)}
                                className={`relative p-4 rounded-2xl border-2 font-black text-sm tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2
                  ${currentUser === person
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-800'
                                    }`}
                            >
                                {person}
                                {currentUser === person && <Check size={16} className="absolute right-3 top-3" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSelector;
