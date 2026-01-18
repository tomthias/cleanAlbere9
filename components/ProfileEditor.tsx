import React, { useState, useEffect } from 'react';
import { User, Check, X, Smile } from 'lucide-react';
import { Person } from '../types';
import { useUser } from './UserContext';
import { supabase } from '../lib/supabase';

const AVATARS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', 'dV', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', 'ANT', '🕷', '🕸', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', 'orangutan', 'mamoth', 'elephant', 'hippopotamus', 'rhinoceros', 'camel', 'dromedary', 'giraffe', 'buffalo', 'mammoth', 'equine', 'pig', 'boar', 'pig_nose', 'ram', 'sheep', 'goat', 'dromedary_camel', 'bactrian_camel', 'llama', 'alpaca', 'vicuna', 'guanaco'];

interface ProfileEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (name: string, avatar: string) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ isOpen, onClose, onUpdate }) => {
    const { currentUser } = useUser();
    const [displayName, setDisplayName] = useState('');
    const [avatar, setAvatar] = useState('👤');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentUser && isOpen) {
            loadProfile();
        }
    }, [currentUser, isOpen]);

    const loadProfile = async () => {
        if (!currentUser || !supabase) return;

        // Default values
        setDisplayName(currentUser);

        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('display_name, avatar_url')
                .eq('user_name', currentUser)
                .single();

            if (data) {
                if (data.display_name) setDisplayName(data.display_name);
                if (data.avatar_url) setAvatar(data.avatar_url);
            }
        } catch (e) {
            console.error("Error loading profile", e);
        }
    };

    const saveProfile = async () => {
        if (!currentUser || !supabase) return;
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_name: currentUser,
                    display_name: displayName,
                    avatar_url: avatar,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_name'
                });

            if (error) throw error;
            if (onUpdate) onUpdate(displayName, avatar);
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Errore nel salvataggio del profilo');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm shadow-2xl border dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Il tuo Profilo</h3>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Avatar Selection */}
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-6xl mb-4 border-4 border-white dark:border-slate-700 shadow-lg">
                                {avatar}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Scegli Avatar</div>
                            <div className="flex gap-2 justify-center overflow-x-auto pb-4 max-w-full px-2 custom-scrollbar">
                                {['👤', '👽', '🤖', '👻', '👾', '🤡', '💩', '🤴', '👸', '👮', '🕵️', '💂', '👷', '🤴', '🧚', '🧞', '🧜', '🧛', '🧟'].map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => setAvatar(emoji)}
                                        className={`text-2xl p-2 rounded-xl transition-all ${avatar === emoji ? 'bg-indigo-100 dark:bg-indigo-900/50 scale-110' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Visualizzato</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Il tuo nome"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={saveProfile}
                            disabled={isSaving}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Salvataggio...' : <>SALVA <Check size={18} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditor;
