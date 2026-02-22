'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMood } from '@/lib/mood-context';
import { useAvatar } from '@/lib/avatar-context';
import { Sparkles, Heart } from 'lucide-react';

const moodOptions = [
  { emoji: '😡', score: 1, label: '很糟糕', color: 'from-slate-400 to-slate-600' },
  { emoji: '😢', score: 3, label: '不太好', color: 'from-blue-400 to-blue-600' },
  { emoji: '😐', score: 5, label: '还可以', color: 'from-yellow-400 to-yellow-600' },
  { emoji: '🙂', score: 7, label: '不错', color: 'from-green-400 to-green-600' },
  { emoji: '🤩', score: 10, label: '太棒了', color: 'from-pink-400 to-pink-600' },
];

interface DailyCheckInModalProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function DailyCheckInModal({ externalOpen, onExternalOpenChange }: DailyCheckInModalProps = {}) {
  const { user } = useAuth();
  const { refreshMoodData } = useMood();
  const { triggerResponse } = useAvatar();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [hoveredMood, setHoveredMood] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      checkDailyCheckIn();
    }
  }, [user]);

  const checkDailyCheckIn = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = localStorage.getItem('lastMoodCheckIn');

    if (lastCheckIn === today) {
      return;
    }

    const { data } = await supabase
      .from('mood_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .maybeSingle();

    if (!data) {
      setTimeout(() => {
        if (externalOpen === undefined) {
          setInternalOpen(true);
        }
      }, 1000);
    } else {
      localStorage.setItem('lastMoodCheckIn', today);
    }
  };

  const handleMoodSelect = async (score: number) => {
    if (!user) return;

    setSelectedMood(score);
    setSaving(true);

    try {
      const { error } = await supabase.from('mood_logs').insert({
        user_id: user.id,
        mood_score: score,
        logged_at: new Date().toISOString(),
      });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('lastMoodCheckIn', today);

      setShowThankYou(true);
      refreshMoodData();

      triggerResponse(score);

      setTimeout(() => {
        setOpen(false);
        setTimeout(() => {
          setShowThankYou(false);
          setSelectedMood(null);
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Error saving mood:', error);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/50 dark:via-pink-950/50 dark:to-blue-950/50 backdrop-blur-xl border-purple-200 dark:border-purple-800">
        {!showThankYou ? (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center">今天过得怎么样？</DialogTitle>
              <DialogDescription className="text-center text-base">
                花几秒钟记录你的心情，让我们一起守护你的情绪健康
              </DialogDescription>
            </DialogHeader>

            <div className="py-8">
              <div className="flex justify-center gap-4">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.score}
                    onClick={() => handleMoodSelect(mood.score)}
                    disabled={saving}
                    onMouseEnter={() => setHoveredMood(mood.score)}
                    onMouseLeave={() => setHoveredMood(null)}
                    className={`group relative flex flex-col items-center gap-2 transition-all duration-300 ${
                      selectedMood === mood.score
                        ? 'scale-110'
                        : hoveredMood === mood.score
                        ? 'scale-105'
                        : 'hover:scale-105'
                    } ${saving && selectedMood !== mood.score ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mood.color} flex items-center justify-center text-4xl shadow-lg group-hover:shadow-xl transition-shadow`}
                    >
                      {mood.emoji}
                    </div>
                    <span
                      className={`text-xs font-medium transition-opacity ${
                        hoveredMood === mood.score ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>你的感受是安全的，我们会尊重并保护你的隐私</p>
            </div>
          </>
        ) : (
          <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse">
                <Heart className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">谢谢你的分享</h3>
            <p className="text-muted-foreground">
              {selectedMood && selectedMood <= 3
                ? '希望明天会更好一些 💙'
                : selectedMood && selectedMood <= 7
                ? '继续保持这份平静 ✨'
                : '很高兴看到你今天这么开心 🎉'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
