'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMood } from '@/lib/mood-context';
import { format, subDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Smile, TrendingUp, Calendar, Heart, Sparkles, Plus, Wind } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BreathingExercise } from '@/components/breathing-exercise';

interface MoodLog {
  id: string;
  mood_score: number;
  logged_at: string;
  notes?: string;
}

const moodOptions = [
  { emoji: '😡', score: 1, label: '很糟糕', color: 'from-slate-400 to-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-900' },
  { emoji: '😢', score: 3, label: '不太好', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  { emoji: '😐', score: 5, label: '还可以', color: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/30' },
  { emoji: '🙂', score: 7, label: '不错', color: 'from-green-400 to-green-600', bgColor: 'bg-green-50 dark:bg-green-900/30' },
  { emoji: '🤩', score: 10, label: '太棒了', color: 'from-pink-400 to-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-900/30' },
];

export default function MoodPage() {
  const { user } = useAuth();
  const { refreshMoodData, latestMoodScore } = useMood();
  const [loading, setLoading] = useState(true);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodNotes, setMoodNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);

  useEffect(() => {
    if (user) {
      loadMoodData();
    }
  }, [user]);

  const loadMoodData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30);

    if (data && data.length > 0) {
      setMoodLogs(data);
      generateChartData(data);
    } else {
      generateMockChartData();
    }

    setLoading(false);
  };

  const generateChartData = (logs: MoodLog[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return startOfDay(date).toISOString();
    });

    const chartData = last30Days.map((dateStr) => {
      const dayLogs = logs.filter(
        (log) => startOfDay(new Date(log.logged_at)).toISOString() === dateStr
      );

      const avgMood = dayLogs.length > 0
        ? dayLogs.reduce((sum, log) => sum + log.mood_score, 0) / dayLogs.length
        : null;

      return {
        date: format(new Date(dateStr), 'MM/dd', { locale: zhCN }),
        mood: avgMood,
      };
    });

    setChartData(chartData);
  };

  const generateMockChartData = () => {
    const mockData = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const baseMood = 5 + Math.sin(i / 5) * 2;
      const randomVariation = Math.random() * 2 - 1;
      const mood = Math.max(1, Math.min(10, Math.round((baseMood + randomVariation) * 10) / 10));

      return {
        date: format(date, 'MM/dd', { locale: zhCN }),
        mood,
      };
    });

    setChartData(mockData);
  };

  const handleSaveMood = async () => {
    if (!user || selectedMood === null) return;

    setSaving(true);

    try {
      const { error } = await supabase.from('mood_logs').insert({
        user_id: user.id,
        mood_score: selectedMood,
        notes: moodNotes || null,
        logged_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSelectedMood(null);
      setMoodNotes('');
      refreshMoodData();
      await loadMoodData();

      if (selectedMood <= 3) {
        setShowBreathingExercise(true);
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setSaving(false);
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😄';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    if (score >= 2) return '😢';
    return '😡';
  };

  const getMoodLabel = (score: number) => {
    if (score >= 8) return '很好';
    if (score >= 6) return '不错';
    if (score >= 4) return '一般';
    if (score >= 2) return '不太好';
    return '很糟';
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#3b82f6';
    if (score >= 4) return '#eab308';
    if (score >= 2) return '#f59e0b';
    return '#6b7280';
  };

  const averageMood = chartData.filter(d => d.mood !== null).length > 0
    ? chartData.filter(d => d.mood !== null).reduce((sum, d) => sum + (d.mood || 0), 0) / chartData.filter(d => d.mood !== null).length
    : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (showBreathingExercise) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <BreathingExercise onClose={() => setShowBreathingExercise(false)} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Smile className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">心情追踪</h1>
              <p className="text-muted-foreground">记录与理解你的情绪</p>
            </div>
          </div>

          {latestMoodScore !== null && (
            <div className="text-center">
              <div className="text-6xl mb-2">{getMoodEmoji(latestMoodScore)}</div>
              <Badge variant="secondary" className="text-sm">
                当前心情: {getMoodLabel(latestMoodScore)}
              </Badge>
            </div>
          )}
        </div>

        <Tabs defaultValue="log" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="log" className="gap-2">
              <Plus className="w-4 h-4" />
              记录心情
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              趋势分析
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="w-4 h-4" />
              历史记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/30 dark:to-pink-950/30 backdrop-blur-sm border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-500" />
                  今天感觉如何？
                </CardTitle>
                <CardDescription>选择最能代表你现在心情的表情</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-4">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.score}
                      onClick={() => setSelectedMood(mood.score)}
                      className={`group relative flex flex-col items-center gap-2 transition-all duration-300 ${
                        selectedMood === mood.score ? 'scale-110' : 'hover:scale-105'
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mood.color} flex items-center justify-center text-4xl shadow-lg transition-shadow ${
                          selectedMood === mood.score ? 'ring-4 ring-purple-400 shadow-xl' : ''
                        }`}
                      >
                        {mood.emoji}
                      </div>
                      <span className="text-xs font-medium">{mood.label}</span>
                    </button>
                  ))}
                </div>

                {selectedMood !== null && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        想说点什么吗？(可选)
                      </label>
                      <Textarea
                        placeholder="记录此刻的感受、想法或发生的事情..."
                        value={moodNotes}
                        onChange={(e) => setMoodNotes(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveMood}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {saving ? '保存中...' : '保存心情'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedMood(null);
                          setMoodNotes('');
                        }}
                      >
                        取消
                      </Button>
                    </div>

                    {selectedMood <= 3 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-muted-foreground mb-3">
                          💙 感觉有些低落？试试呼吸练习，帮助你放松心情
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBreathingExercise(true)}
                          className="gap-2"
                        >
                          <Wind className="w-4 h-4" />
                          开始呼吸练习
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  30 天心情曲线
                </CardTitle>
                <CardDescription>
                  平均心情: {averageMood.toFixed(1)}/10
                  {moodLogs.length === 0 && ' (演示数据)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 10]} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                      formatter={(value: any) => [`${value.toFixed(1)}/10`, '心情指数']}
                    />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke="#a855f7"
                      strokeWidth={3}
                      fill="url(#moodGradient)"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {moodLogs.length === 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">这是演示数据</p>
                        <p className="text-xs text-muted-foreground">
                          开始记录你的心情，真实的情绪曲线会自动生成。坚持记录 7 天以上，你会看到更有价值的趋势分析。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">最佳状态</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl mb-2">😄</div>
                  <p className="text-2xl font-bold text-green-600">
                    {chartData.filter(d => d.mood && d.mood >= 8).length} 天
                  </p>
                  <p className="text-sm text-muted-foreground">心情很好的日子</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">普通状态</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl mb-2">😐</div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {chartData.filter(d => d.mood && d.mood >= 4 && d.mood < 8).length} 天
                  </p>
                  <p className="text-sm text-muted-foreground">心情一般的日子</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">需要关注</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl mb-2">😢</div>
                  <p className="text-2xl font-bold text-blue-600">
                    {chartData.filter(d => d.mood && d.mood < 4).length} 天
                  </p>
                  <p className="text-sm text-muted-foreground">心情低落的日子</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {moodLogs.length === 0 ? (
              <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">还没有心情记录</p>
                  <Button variant="outline">开始记录</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {moodLogs.map((log) => (
                  <Card
                    key={log.id}
                    className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{getMoodEmoji(log.mood_score)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              style={{ backgroundColor: getMoodColor(log.mood_score) }}
                              className="text-white"
                            >
                              {log.mood_score}/10 - {getMoodLabel(log.mood_score)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(log.logged_at), 'yyyy年M月d日 HH:mm', {
                                locale: zhCN,
                              })}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
