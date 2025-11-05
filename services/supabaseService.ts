import { createClient, SupabaseClient } from '@supabase/supabase-js';
// FIX: The `Session` type is not exported from '@clerk/clerk-react'. Using `any` as a fallback since the exact type is not available for import.
import { ToolType, SavedSession, TranscriptionEntry } from '../types';

// FIX: Use process.env and the VITE_ prefix to access environment variables correctly.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;


// This function creates a Supabase client that is authenticated with Clerk.
export const createClerkSupabaseClient = (session: any | null): SupabaseClient | null => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !session) {
        return null;
    }

    return createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            global: {
                // The `accessToken` function is called by the Supabase client to get a fresh token.
                // This ensures that all requests to Supabase are authenticated with the current user's session.
                // FIX: Removed default `{}` for options and used optional chaining to prevent type error.
                fetch: async (url, options) => {
                    const clerkToken = await session.getToken({ template: 'supabase' });

                    const headers = new Headers(options?.headers);
                    headers.set('Authorization', `Bearer ${clerkToken}`);
                    
                    return fetch(url, { ...options, headers });
                },
            },
        }
    );
};

// --- User Roles ---
export const getUserRole = async (client: SupabaseClient): Promise<string | null> => {
    // This assumes a 'user_roles' table with RLS enabled.
    // The table should have 'user_id' (matching Clerk's user ID) and 'role' columns.
    const { data, error } = await client.from('user_roles').select('role').single();
    if (error) {
        // It's common for a user to not have a role initially, so don't log every error.
        if (error.code !== 'PGRST116') { // PGRST116 = 'JWSError JWSInvalidSignature'
             console.error('Error fetching user role:', error);
        }
        return null;
    }
    return data?.role || 'user'; // Default to 'user' if role is null
};


// --- Favorites ---
export const getFavorites = async (client: SupabaseClient): Promise<ToolType[]> => {
    const { data, error } = await client.from('favorites').select('tool_type');
    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
    return data.map((item: { tool_type: ToolType }) => item.tool_type);
};

export const toggleFavorite = async (client: SupabaseClient, toolType: ToolType, isFavorite: boolean): Promise<void> => {
    if (isFavorite) {
        const { error } = await client.from('favorites').delete().match({ tool_type: toolType });
        if (error) console.error('Error removing favorite:', error);
    } else {
        const { error } = await client.from('favorites').insert({ tool_type: toolType });
         if (error) console.error('Error adding favorite:', error);
    }
};

// --- Tool Usage ---
export const getUsageData = async (client: SupabaseClient): Promise<Record<ToolType, number>> => {
    // This function now fetches daily usage data.
    // It assumes a 'daily_tool_usage' table with RLS enabled and columns:
    // tool_type, launch_count, usage_date.
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const { data, error } = await client
        .from('daily_tool_usage')
        .select('tool_type, launch_count')
        .eq('usage_date', today);

    if (error) {
        console.error('Error fetching daily usage data:', error);
        return {} as Record<ToolType, number>;
    }

    return data.reduce((acc: Record<ToolType, number>, item: { tool_type: ToolType, launch_count: number }) => {
        acc[item.tool_type] = item.launch_count;
        return acc;
    }, {} as Record<ToolType, number>);
};

export const incrementToolUsage = async (client: SupabaseClient, toolType: ToolType): Promise<{error?: any}> => {
    // This now calls an RPC function that handles the logic of incrementing
    // the daily usage count for a tool, creating a new row if one doesn't exist for the day.
    const { error } = await client.rpc('increment_daily_tool_usage', { tool_type_arg: toolType });
    if (error) {
        console.error('Error incrementing daily tool usage:', error);
    }
    return { error };
};


// --- AI Hub Sessions ---
export const getSavedSessions = async (client: SupabaseClient): Promise<SavedSession[]> => {
    const { data, error } = await client.from('sessions').select('*').order('timestamp', { ascending: false });
    if (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }
    return data;
};

export const saveSession = async (client: SupabaseClient, name: string, transcript: TranscriptionEntry[]): Promise<void> => {
    const { error } = await client.from('sessions').insert({
        name,
        transcript,
        timestamp: new Date().toISOString()
    });
    if (error) throw error;
};

export const deleteSession = async (client: SupabaseClient, sessionId: string): Promise<void> => {
    const { error } = await client.from('sessions').delete().match({ id: sessionId });
    if (error) throw error;
};