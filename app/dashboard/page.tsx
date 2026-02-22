'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, Note, Category } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMood } from '@/lib/mood-context';
import { format, subDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Heart,
  Brain,
  Smile,
  Activity,
  FileText,
  Plus,
  Sparkles,
  ArrowRight,
  Zap,
  Feather,
} from 'lucide-react';
import Link from 'next/link';
import { countWords, getPlainTextFromHtml } from '@/lib/word-count';
import { LifePanoramaChart } from '@/components/dashboard/life-panorama-chart';
import { RecentLogsFeed } from '@/components/dashboard/recent-logs-feed';
import {
  moodToIndex,
  wordsToCreationIndex,
  notesToLearningIndex,
  fitnessToHealthIndex,
  spendingToFinanceIndex,
  DayData,
} from '@/lib/life-indices';
import { useLifeGoals } from '@/hooks/use-life-goals';
import { OmniInput } from '@/components/omni-input/omni-input';
import { ExtractionResult } from '@/lib/ai-processor';
import { useToast } from '@/hooks/use-toast';

interface MoodLog {
  id: string;
  logged_at: string;
  mood_score: number;
  notes?: string;
}

interface FitnessEntry {
  id: string;
  date: string;
  steps: number;
  calories: number;
  workout_minutes: number;
}

interface FinanceDayTotal {
  date: string;
  totalSpend: number;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { getPlaceholder, latestMoodScore, refreshMoodData } = useMood();
  const { goals, saveGoals, saving: savingGoals } = useLifeGoals(user?.id);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30>(7);

  const [mindStats, setMindStats] = useState({
    totalNotes: 0,
    totalWords: 0,
    todayNotes: 0,
    streak: 0,
  });

  const [recentNotes, setRecentNotes] = useState<(Note & { category?: Category })[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [fitnessEntries, setFitnessEntries] = useState<FitnessEntry[]>([]);
  const [rawData, setRawData] = useState<{
    allNotes: { content: string; created_at: string; has_narrative: boolean }[];
    moods: MoodLog[];
    fitness: FitnessEntry[];
    finance: FinanceDayTotal[];
  }>({ allNotes: [], moods: [], fitness: [], finance: [] });

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, range]);

  const panoramaData: DayData[] = buildPanorama(
    range,
    rawData.allNotes,
    rawData.moods,
    rawData.fitness,
    rawData.finance,
    goals
  );

  const loadDashboardData = async () => {
    if (!user) return;

    const today = startOfDay(new Date());
    const rangeStart = subDays(today, range - 1);

    const [
      allNotesResult,
      todayNotesResult,
      recentNotesResult,
      moodResult,
      fitnessResult,
      financeResult,
    ] = await Promise.all([
      supabase.from('notes').select('content, created_at').eq('user_id', user.id),
      supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString()),
      supabase
        .from('notes')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('mood_logs')
        .select('id, logged_at, mood_score, context')
        .eq('user_id', user.id)
        .gte('logged_at', rangeStart.toISOString())
        .order('logged_at', { ascending: true }),
      supabase
        .from('fitness_data')
        .select('id, date, steps, calories, workout_minutes')
        .eq('user_id', user.id)
        .gte('date', format(rangeStart, 'yyyy-MM-dd'))
        .order('date', { ascending: true }),
      supabase
        .from('finance_transactions')
        .select('date, amount, type')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', format(rangeStart, 'yyyy-MM-dd')),
    ]);

    let totalWords = 0;
    if (allNotesResult.data) {
      allNotesResult.data.forEach((note) => {
        totalWords += countWords(getPlainTextFromHtml(note.content));
      });
    }

    const streak = calculateStreak(allNotesResult.data || []);
    setMindStats({
      totalNotes: allNotesResult.data?.length || 0,
      totalWords,
      todayNotes: todayNotesResult.count || 0,
      streak,
    });

    const moods = (moodResult.data || []).map((m: any) => ({
      id: m.id,
      logged_at: m.logged_at,
      mood_score: m.mood_score,
      notes: m.context,
    }));

    const financeByDay = buildFinanceDayTotals(financeResult.data || []);

    setRecentNotes(recentNotesResult.data || []);
    setMoodLogs(moods);
    setFitnessEntries(fitnessResult.data || []);
    setRawData({
      allNotes: (allNotesResult.data || []).map((n) => ({ ...n, has_narrative: true })),
      moods,
      fitness: fitnessResult.data || [],
      finance: financeByDay,
    });
    setLoading(false);
  };

  const handleOmniConfirm = async (text: string, result: ExtractionResult) => {
    if (!user) return;

    const saves: PromiseLike<void>[] = [];

    if (result.health?.steps || result.health?.workout_minutes) {
      saves.push(
        supabase.from('fitness_data').insert({
          user_id: user.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          steps: result.health.steps ?? 0,
          calories: result.health.calories ?? 0,
          workout_minutes: result.health.workout_minutes ?? 0,
          source: 'omni_input',
        }).then(() => {})
      );
    }

    if (result.health?.weight) {
      saves.push(
        supabase.from('vital_signs').insert({
          user_id: user.id,
          weight: result.health.weight,
        }).then(() => {})
      );
    }

    const financesToSave = result.finances.length > 0 ? result.finances : (result.finance ? [result.finance] : []);
    for (const fin of financesToSave) {
      saves.push(
        supabase.from('finance_transactions').insert({
          user_id: user.id,
          amount: fin.amount,
          type: fin.type,
          category: fin.category,
          date: format(new Date(), 'yyyy-MM-dd'),
          note: fin.note ?? (result.hasNarrative ? result.narrative : text),
          is_narrative: false,
          source: 'omni_input',
        }).then(() => {})
      );
    }

    if (result.mood) {
      saves.push(
        supabase.from('mood_logs').insert({
          user_id: user.id,
          mood_score: result.mood.score,
          context: result.hasNarrative ? result.narrative : null,
        }).then(() => {})
      );
    }

    if (result.hasNarrative && result.narrative) {
      saves.push(
        supabase.from('notes').insert({
          user_id: user.id,
          title: text.slice(0, 60),
          content: `<p>${result.narrative}</p>`,
        }).then(() => {})
      );
    }

    await Promise.all(saves as Promise<void>[]);

    await loadDashboardData();
    if (result.mood) refreshMoodData();

    const finCount = result.finances.length || (result.finance ? 1 : 0);
    const parts = [
      result.health && '健康数据',
      finCount > 0 && (finCount > 1 ? `${finCount} 条财务记录` : '财务记录'),
      result.mood && '心情',
      result.hasNarrative && '日记',
    ].filter(Boolean);

    toast({
      title: '已保存',
      description: parts.length > 0 ? `已记录：${parts.join('、')}` : '内容已保存',
    });
  };

  const calculateStreak = (notes: { created_at: string }[]) => {
    if (notes.length === 0) return 0;
    const dates = notes.map((n) => startOfDay(new Date(n.created_at)).getTime());
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);
    let streak = 0;
    let current = startOfDay(new Date()).getTime();
    for (const date of uniqueDates) {
      if (date === current || date === current - 86400000) {
        streak++;
        current = date - 86400000;
      } else break;
    }
    return streak;
  };

  const getMoodEmoji = (score: number | null) => {
    if (!score) return '—';
    if (score >= 9) return '😄';
    if (score >= 7) return '🙂';
    if (score >= 5) return '😐';
    if (score >= 3) return '😔';
    return '😢';
  };

  const getMoodLabel = (score: number | null) => {
    if (!score) return '未记录';
    if (score >= 9) return '很棒';
    if (score >= 7) return '良好';
    if (score >= 5) return '一般';
    if (score >= 3) return '较差';
    return '很差';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-7">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 shadow-2xl">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative p-8 md:p-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-300 text-sm font-medium mb-1 uppercase tracking-widest">
                  {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {profile?.full_name ? `${profile.full_name}，你好` : '欢迎回来'}
                </h1>
              </div>
              <Feather className="w-12 h-12 text-blue-400/30 hidden md:block" />
            </div>

            <OmniInput
              onConfirm={handleOmniConfirm}
              placeholder={getPlaceholder()}
              className="mb-4"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/notes/new">
                <Button size="sm" className="h-9 px-4 bg-white/10 hover:bg-white/20 border-white/20 text-white border backdrop-blur-sm text-xs">
                  <Plus className="w-4 h-4 mr-1.5" />
                  完整笔记
                </Button>
              </Link>
              <Link href="/mood">
                <Button size="sm" variant="ghost" className="h-9 px-4 text-white/70 hover:text-white hover:bg-white/10 text-xs">
                  <Smile className="w-4 h-4 mr-1.5" />
                  详细心情
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Brain className="w-5 h-5 text-blue-500" />}
            label="笔记总数"
            value={mindStats.totalNotes.toString()}
            sub="条"
            colorClass="bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/40"
          />
          <StatCard
            icon={<FileText className="w-5 h-5 text-teal-500" />}
            label="总字数"
            value={
              mindStats.totalWords >= 1000
                ? `${(mindStats.totalWords / 1000).toFixed(1)}K`
                : mindStats.totalWords.toString()
            }
            sub="字"
            colorClass="bg-teal-50 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/40"
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-orange-500" />}
            label="连续打卡"
            value={mindStats.streak.toString()}
            sub="天"
            colorClass="bg-orange-50 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/40"
          />
          <StatCard
            icon={<Smile className="w-5 h-5 text-amber-500" />}
            label="今日心情"
            value={getMoodEmoji(latestMoodScore)}
            sub={getMoodLabel(latestMoodScore)}
            colorClass="bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40"
          />
        </div>

        <LifePanoramaChart
          data={panoramaData}
          range={range}
          onRangeChange={setRange}
          goals={goals}
          onSaveGoals={saveGoals}
          savingGoals={savingGoals}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/notes/new"
            icon={<FileText className="w-5 h-5" />}
            label="写新笔记"
            desc="记录想法与灵感"
            colorClass="from-blue-500 to-teal-500"
          />
          <QuickActionCard
            href="/mood"
            icon={<Heart className="w-5 h-5" />}
            label="记录心情"
            desc="追踪情绪状态"
            colorClass="from-amber-500 to-orange-500"
          />
          <QuickActionCard
            href="/finance"
            icon={<Activity className="w-5 h-5" />}
            label="财务记账"
            desc="管理收支明细"
            colorClass="from-emerald-500 to-teal-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold">近期日记</h2>
              <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">仅含叙述内容</span>
            </div>
            <Link href="/notes">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                全部笔记
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <RecentLogsFeed
            notes={recentNotes}
            moodLogs={moodLogs.filter((m) => m.notes && m.notes.trim().length > 0)}
            fitnessEntries={[]}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function buildFinanceDayTotals(rows: { date: string; amount: number; type: string }[]): FinanceDayTotal[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    if (row.type === 'expense') {
      map[row.date] = (map[row.date] || 0) + row.amount;
    }
  }
  return Object.entries(map).map(([date, totalSpend]) => ({ date, totalSpend }));
}

function buildPanorama(
  days: number,
  allNotes: { content: string; created_at: string; has_narrative: boolean }[],
  moods: MoodLog[],
  fitness: FitnessEntry[],
  finance: FinanceDayTotal[],
  goals: ReturnType<typeof useLifeGoals>['goals']
): DayData[] {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateLabel = format(date, 'MM/dd', { locale: zhCN });

    const dayNotes = allNotes.filter(
      (n) => format(new Date(n.created_at), 'yyyy-MM-dd') === dateKey
    );
    const dayMood = moods.find(
      (m) => format(new Date(m.logged_at), 'yyyy-MM-dd') === dateKey
    );
    const dayFitness = fitness.find((f) => f.date === dateKey);
    const dayFinance = finance.find((f) => f.date === dateKey);

    const dayWords = dayNotes.reduce(
      (sum, n) => sum + countWords(getPlainTextFromHtml(n.content)),
      0
    );

    return {
      date: dateKey,
      dateLabel,
      moodIndex: dayMood ? moodToIndex(dayMood.mood_score, goals) : null,
      creationIndex: dayNotes.length > 0 ? wordsToCreationIndex(dayWords, goals) : null,
      learningIndex: dayNotes.length > 0 ? notesToLearningIndex(dayNotes.length, dayWords, goals) : null,
      healthIndex: dayFitness
        ? fitnessToHealthIndex(dayFitness.steps, dayFitness.workout_minutes, goals)
        : null,
      financeIndex: dayFinance != null
        ? spendingToFinanceIndex(dayFinance.totalSpend, goals.daily_budget)
        : null,
      rawMood: dayMood?.mood_score ?? null,
      rawWords: dayWords > 0 ? dayWords : null,
      rawSteps: dayFitness?.steps ?? null,
      rawWorkout: dayFitness?.workout_minutes ?? null,
      rawSpend: dayFinance?.totalSpend ?? null,
      notes: [],
    };
  });
}

function StatCard({
  icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  colorClass: string;
}) {
  return (
    <Card className={`${colorClass} rounded-2xl shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  href,
  icon,
  label,
  desc,
  colorClass,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  colorClass: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClass} p-5 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
      >
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">{icon}</div>
          <div>
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-white/70">{desc}</p>
          </div>
        </div>
        <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
