'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';

interface MoodContextType {
  latestMoodScore: number | null;
  loading: boolean;
  getPlaceholder: () => string;
  refreshMoodData: () => Promise<void>;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [latestMoodScore, setLatestMoodScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLatestMood();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadLatestMood = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mood_logs')
      .select('mood_score')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLatestMoodScore(data.mood_score);
    }

    setLoading(false);
  };

  const getPlaceholder = () => {
    if (latestMoodScore === null) {
      return "What's on your mind?";
    }

    if (latestMoodScore <= 4) {
      return "It's okay not to be okay. Want to write it down?";
    }

    if (latestMoodScore <= 6) {
      return "What are you thinking about today?";
    }

    return "What's on your mind?";
  };

  return (
    <MoodContext.Provider value={{ latestMoodScore, loading, getPlaceholder, refreshMoodData: loadLatestMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}
