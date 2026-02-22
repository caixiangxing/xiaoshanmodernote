'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LifeGoals, DEFAULT_GOALS } from '@/lib/life-goals';

export function useLifeGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<LifeGoals>(DEFAULT_GOALS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('life_goals')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.life_goals && Object.keys(data.life_goals).length > 0) {
          setGoals({ ...DEFAULT_GOALS, ...(data.life_goals as Partial<LifeGoals>) });
        }
      });
  }, [userId]);

  const saveGoals = useCallback(
    async (updated: LifeGoals) => {
      if (!userId) return;
      setSaving(true);
      setGoals(updated);
      await supabase
        .from('profiles')
        .update({ life_goals: updated })
        .eq('id', userId);
      setSaving(false);
    },
    [userId]
  );

  return { goals, saveGoals, saving };
}
