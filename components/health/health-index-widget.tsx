'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface ScoreBreakdown {
  label: string;
  score: number;
  max: number;
  color: string;
}

export function HealthIndexWidget() {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (user) computeScore();
  }, [user]);

  const computeScore = async () => {
    if (!user) return;
    setLoading(true);

    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [fitnessRes, vitalRes, medRes, moodRes] = await Promise.all([
      supabase
        .from('fitness_data')
        .select('steps, calories, workout_minutes')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false }),
      supabase
        .from('vital_signs')
        .select('weight, heart_rate')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(5),
      supabase
        .from('medication_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('active', true),
      supabase
        .from('mood_logs')
        .select('mood_score')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString())
        .order('logged_at', { ascending: false }),
    ]);

    const fitnessData = fitnessRes.data || [];
    const avgSteps = fitnessData.length
      ? fitnessData.reduce((s, d) => s + (d.steps || 0), 0) / fitnessData.length
      : 0;
    const avgWorkout = fitnessData.length
      ? fitnessData.reduce((s, d) => s + (d.workout_minutes || 0), 0) / fitnessData.length
      : 0;

    const fitnessScore = Math.min(
      25,
      Math.round((avgSteps / 10000) * 15 + (avgWorkout / 60) * 10)
    );

    const moodData = moodRes.data || [];
    const avgMood = moodData.length
      ? moodData.reduce((s, d) => s + d.mood_score, 0) / moodData.length
      : 5;
    const moodScore = Math.round((avgMood / 10) * 25);

    const medCount = (medRes.data || []).length;
    const medicationScore = Math.min(25, medCount > 0 ? 20 : 25);

    const vitalData = vitalRes.data || [];
    const vitalScore = vitalData.length > 0 ? Math.min(25, 15 + vitalData.length * 2) : 10;

    const total = fitnessScore + moodScore + medicationScore + vitalScore;

    setScore(total);
    setBreakdown([
      { label: '健身活动', score: fitnessScore, max: 25, color: 'bg-emerald-500' },
      { label: '情绪状态', score: moodScore, max: 25, color: 'bg-blue-500' },
      { label: '用药追踪', score: medicationScore, max: 25, color: 'bg-violet-500' },
      { label: '体征记录', score: vitalScore, max: 25, color: 'bg-amber-500' },
    ]);
    setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  };

  const getScoreGrade = (s: number) => {
    if (s >= 90) return { label: '优秀', color: 'text-emerald-600 dark:text-emerald-400' };
    if (s >= 75) return { label: '良好', color: 'text-blue-600 dark:text-blue-400' };
    if (s >= 60) return { label: '一般', color: 'text-amber-600 dark:text-amber-400' };
    return { label: '待改善', color: 'text-red-600 dark:text-red-400' };
  };

  const grade = score !== null ? getScoreGrade(score) : null;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = score !== null ? circumference * (1 - score / 100) : circumference;

  return (
    <Card className="h-full bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200/60 dark:border-amber-800/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
            健康指数
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-amber-600"
            onClick={computeScore}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-amber-100 dark:text-amber-900/40" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="url(#healthGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {loading ? '...' : score ?? '—'}
              </span>
              {grade && <span className={`text-xs font-medium ${grade.color}`}>{grade.label}</span>}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {breakdown.map((item) => (
              <div key={item.label} className="space-y-0.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.label}</span>
                  <span>{item.score}/{item.max}</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/40 dark:bg-slate-800/30 rounded-lg px-3 py-2">
          <TrendingUp className="w-3 h-3 text-amber-500" />
          <span>基于过去 7 天数据生成 {lastUpdated && `· 更新于 ${lastUpdated}`}</span>
        </div>
      </CardContent>
    </Card>
  );
}
