import { supabase } from '../lib/supabase';
import { Person } from '../types';

export interface SwapRequest {
    id: string;
    week_id: number;
    area_id: string;
    original_person: Person;
    swapped_with: Person | null;
    status: 'pending' | 'accepted' | 'cancelled';
    created_at: string;
}

/**
 * Creates a new swap request
 */
export const createSwapRequest = async (
    weekId: number,
    areaId: string,
    person: Person
): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
        .from('area_swaps')
        .insert({
            week_id: weekId,
            area_id: areaId,
            original_person: person,
            status: 'pending'
        });

    if (error) {
        console.error('❌ Error creating swap request:', error);
        throw error;
    }
};

/**
 * Accepts a swap request
 */
export const acceptSwapRequest = async (
    swapId: string,
    acceptor: Person
): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
        .from('area_swaps')
        .update({
            swapped_with: acceptor,
            status: 'accepted'
        })
        .eq('id', swapId);

    if (error) {
        console.error('❌ Error accepting swap request:', error);
        throw error;
    }
};

/**
 * Cancels a swap request
 */
export const cancelSwapRequest = async (swapId: string): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
        .from('area_swaps')
        .update({ status: 'cancelled' })
        .eq('id', swapId);

    if (error) {
        console.error('❌ Error cancelling swap request:', error);
        throw error;
    }
};

/**
 * Loads all active (pending or accepted) swaps
 */
export const loadSwaps = async (): Promise<SwapRequest[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('area_swaps')
        .select('*')
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error loading swaps:', error);
        return [];
    }

    return data as SwapRequest[];
};

/**
 * Subscribes to swap updates
 */
export const subscribeToSwapUpdates = (onUpdate: () => void): (() => void) => {
    if (!supabase) return () => { };

    const subscription = supabase
        .channel('public:area_swaps')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'area_swaps' },
            () => {
                console.log('🔄 Swap table update detected');
                onUpdate();
            }
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
};
