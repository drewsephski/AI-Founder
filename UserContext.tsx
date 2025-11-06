import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { UserPlan } from './types';
import { User, Session } from '@supabase/supabase-js';
import {
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  getSession as supabaseGetSession,
  onAuthStateChange,
  getUserProfile,
  upsertUserProfile,
  decrementUserUsage,
  UserProfile,
} from './services/supabaseService';

interface UsageLimits {
  aiChatGenerations: number;
  imageGenerations: number;
}

interface UserContextType {
  session: Session | null;
  user: User | null;
  authenticated: boolean;
  userPlan: UserPlan;
  usageLimits: UsageLimits;
  updateUserPlan: (newPlan: UserPlan) => Promise<void>;
  decrementAIChatGenerations: () => Promise<void>;
  decrementImageGenerations: () => Promise<void>;
  canAccessTool: (requiredPlan: UserPlan | undefined) => boolean;
  login: (email: string, password: string) => Promise<{ user: User | null }>;
  register: (email: string, password: string) => Promise<{ user: User | null }>;
  logout: () => Promise<void>;
  loadingAuth: boolean; // Add loading state for authentication
}

const defaultUsageLimits: Record<UserPlan, UsageLimits> = {
  starter: {
    aiChatGenerations: 5,
    imageGenerations: 0,
  },
  pro: {
    aiChatGenerations: 50,
    imageGenerations: 5,
  },
  advanced: {
    aiChatGenerations: Infinity,
    imageGenerations: Infinity,
  },
};

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>('starter');
  const [usageLimits, setUsageLimits] = useState<UsageLimits>(defaultUsageLimits['starter']);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const authenticated = !!user;

  // --- Auth State Management ---
  useEffect(() => {
    const handleInitialSession = async () => {
      setLoadingAuth(true);
      try {
        const { session: initialSession, user: initialUser } = await supabaseGetSession();
        setSession(initialSession);
        setUser(initialUser);
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoadingAuth(false);
      }
    };

    handleInitialSession();

    const { data: authListener } = onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoadingAuth(false);
    });

    return () => {
      // Fix: Access unsubscribe from data.subscription
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- User Profile & Usage Limits Management ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          let profile = await getUserProfile(user.id);
          if (!profile) {
            // Create profile if it doesn't exist (e.g., new user or first login)
            profile = await upsertUserProfile({
              id: user.id,
              email: user.email!,
              user_plan: 'starter',
              ai_chat_generations_daily_limit: defaultUsageLimits['starter'].aiChatGenerations,
              image_generations_daily_limit: defaultUsageLimits['starter'].imageGenerations,
              last_usage_reset_date: new Date().toDateString(),
            });
          }

          const today = new Date().toDateString();
          let currentPlan = profile.user_plan;
          let currentChatLimits = profile.ai_chat_generations_daily_limit;
          let currentImageLimits = profile.image_generations_daily_limit;
          let lastReset = profile.last_usage_reset_date;

          // Reset daily limits if a new day has started
          if (lastReset !== today) {
            console.log("Daily usage limits reset for user:", user.id);
            currentChatLimits = defaultUsageLimits[currentPlan].aiChatGenerations;
            currentImageLimits = defaultUsageLimits[currentPlan].imageGenerations;
            lastReset = today;
            await upsertUserProfile({
              id: user.id,
              ai_chat_generations_daily_limit: currentChatLimits,
              image_generations_daily_limit: currentImageLimits,
              last_usage_reset_date: lastReset,
            });
          }

          setUserPlan(currentPlan);
          setUsageLimits({
            aiChatGenerations: currentChatLimits,
            imageGenerations: currentImageLimits,
          });

        } catch (error) {
          console.error("Error fetching or creating user profile:", error);
          // Fallback to default starter plan in case of error
          setUserPlan('starter');
          setUsageLimits(defaultUsageLimits['starter']);
        }
      } else {
        // If no user, reset to default starter plan
        setUserPlan('starter');
        setUsageLimits(defaultUsageLimits['starter']);
      }
    };

    fetchUserProfile();
  }, [user]);

  // --- Auth Actions ---
  const login = useCallback(async (email: string, password: string) => {
    setLoadingAuth(true);
    try {
      const { user: loggedInUser } = await supabaseSignIn(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        // User profile fetch will be triggered by the user effect
      }
      return { user: loggedInUser };
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoadingAuth(true);
    try {
      const { user: registeredUser } = await supabaseSignUp(email, password);
      if (registeredUser) {
        setUser(registeredUser);
        // User profile creation will be triggered by the user effect
      }
      return { user: registeredUser };
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoadingAuth(true);
    try {
      await supabaseSignOut();
      setSession(null);
      setUser(null);
      // Reset to starter plan and default limits manually
      setUserPlan('starter');
      setUsageLimits(defaultUsageLimits['starter']);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  // --- Plan & Usage Actions ---
  const updateUserPlan = useCallback(async (newPlan: UserPlan) => {
    if (!user) {
      console.warn("Cannot update plan: no user is logged in.");
      return;
    }
    try {
      const updatedProfile = await upsertUserProfile({
        id: user.id,
        user_plan: newPlan,
        // Reset limits to default for the new plan, and update reset date
        ai_chat_generations_daily_limit: defaultUsageLimits[newPlan].aiChatGenerations,
        image_generations_daily_limit: defaultUsageLimits[newPlan].imageGenerations,
        last_usage_reset_date: new Date().toDateString(),
      });
      setUserPlan(updatedProfile.user_plan);
      setUsageLimits({
        aiChatGenerations: updatedProfile.ai_chat_generations_daily_limit,
        imageGenerations: updatedProfile.image_generations_daily_limit,
      });
    } catch (error) {
      console.error("Failed to update user plan in Supabase:", error);
    }
  }, [user]);

  const decrementAIChatGenerations = useCallback(async () => {
    if (!user) return;
    try {
      await decrementUserUsage(user.id, 'ai_chat_generations_daily_limit');
      setUsageLimits(prev => ({ ...prev, aiChatGenerations: prev.aiChatGenerations - 1 }));
    } catch (error) {
      console.error("Failed to decrement AI Chat Generations:", error);
    }
  }, [user]);

  const decrementImageGenerations = useCallback(async () => {
    if (!user) return;
    try {
      await decrementUserUsage(user.id, 'image_generations_daily_limit');
      setUsageLimits(prev => ({ ...prev, imageGenerations: prev.imageGenerations - 1 }));
    } catch (error) {
      console.error("Failed to decrement Image Generations:", error);
    }
  }, [user]);

  const canAccessTool = useCallback((requiredPlan: UserPlan | undefined) => {
    if (!requiredPlan) return true; // No specific plan required
    const plans: UserPlan[] = ['starter', 'pro', 'advanced'];
    return plans.indexOf(userPlan) >= plans.indexOf(requiredPlan);
  }, [userPlan]);

  const value = React.useMemo(() => ({
    session,
    user,
    authenticated,
    userPlan,
    usageLimits,
    updateUserPlan,
    decrementAIChatGenerations,
    decrementImageGenerations,
    canAccessTool,
    login,
    register,
    logout,
    loadingAuth,
  }), [
    session,
    user,
    authenticated,
    userPlan,
    usageLimits,
    updateUserPlan,
    decrementAIChatGenerations,
    decrementImageGenerations,
    canAccessTool,
    login,
    register,
    logout,
    loadingAuth,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};