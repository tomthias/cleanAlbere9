import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface SyncStatusProps {
    isSyncing: boolean;
    isOnline: boolean;
    lastSyncedAt: Date | null;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ isSyncing, isOnline, lastSyncedAt }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-100 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-400">
            {isSyncing ? (
                <>
                    <RefreshCw size={12} className="animate-spin text-indigo-500" />
                    <span>Syncing...</span>
                </>
            ) : isOnline ? (
                <>
                    <Cloud size={12} className="text-emerald-500" />
                    <span>Online</span>
                </>
            ) : (
                <>
                    <CloudOff size={12} className="text-rose-500" />
                    <span>Offline</span>
                </>
            )}
        </div>
    );
};

export default SyncStatus;
