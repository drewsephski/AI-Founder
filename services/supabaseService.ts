import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { ToolType, SavedSession, TranscriptionEntry, UserPlan } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error("Supabase URL or Anon Key is missing. Supabase functionality will be disabled.");
}

// Ensure Supabase client is initialized before use
function getSupabase() {
  if (!supabase) {
    throw new Error("Supabase client not initialized. Check environment variables.");
  }
  return supabase;
}

// --- Authentication ---
export const signIn = async (email: string, password: string) => {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
};

export const getSession = async (): Promise<{ session: Session | null; user: User | null }> => {
  // Fix: Explicitly destructure data from the response to help TypeScript infer types correctly.
  const response = await getSupabase().auth.getSession();
  const { data, error } = response;
  if (error) throw error;
  return { session: data.session, user: data.user };
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return getSupabase().auth.onAuthStateChange(callback);
};

// --- User Profiles ---
export interface UserProfile {
  id: string;
  email: string;
  user_plan: UserPlan;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  ai_chat_generations_daily_limit: number;
  image_generations_daily_limit: number;
  last_usage_reset_date: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found'
    console.error("Error fetching user profile:", error);
    throw error;
  }
  return data;
};

export const upsertUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile> => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) {
    console.error("Error upserting user profile:", error);
    throw error;
  }
  return data;
};

// --- Favorites (now uses Supabase) ---
export const getFavorites = async (userId: string): Promise<ToolType[]> => {
  const { data, error } = await getSupabase()
    .from('favorites')
    .select('tool_type')
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }
  return data.map(fav => fav.tool_type as ToolType);
};

export const toggleFavorite = async (userId: string, toolType: ToolType, isFavorite: boolean): Promise<void> => {
  if (isFavorite) {
    const { error } = await getSupabase()
      .from('favorites')
      .insert({ user_id: userId, tool_type: toolType });
    if (error) throw error;
  } else {
    const { error } = await getSupabase()
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('tool_type', toolType);
    if (error) throw error;
  }
};

// --- Tool Usage (now uses Supabase) ---
export const decrementUserUsage = async (
  userId: string,
  usageType: 'ai_chat_generations_daily_limit' | 'image_generations_daily_limit'
): Promise<void> => {
  const { data, error } = await getSupabase()
    .rpc('decrement_usage', { user_id_param: userId, usage_type_param: usageType }); // Using an RPC for atomic decrement

  if (error) {
    console.error(`Error decrementing ${usageType} for user ${userId}:`, error);
    throw error;
  }
};


// --- AI Hub Sessions (now uses Supabase) ---
export const getSavedSessions = async (userId: string): Promise<SavedSession[]> => {
  const { data, error } = await getSupabase()
    .from('ai_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error("Error fetching saved sessions:", error);
    throw error;
  }
  return data.map(session => ({
    id: session.id,
    name: session.name,
    timestamp: session.timestamp,
    transcript: session.transcript,
  }));
};

export const saveSession = async (userId: string, name: string, transcript: TranscriptionEntry[]): Promise<void> => {
  const { error } = await getSupabase()
    .from('ai_sessions')
    .insert({ user_id: userId, name, transcript });

  if (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const { error } = await getSupabase()
    .from('ai_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};