'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Footprints, Flame, Timer, Plus, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface TodayFitness {
  steps: number;
  calories: number;
  workout_minutes: number;
}

export function FitnessWidget() {
  const { user } = useAuth();
  const [today, setToday] = useState<TodayFitness>({ steps: 0, calories: 0, workout_minutes: 0 });
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({ steps: '', calories: '', workout_minutes: '' });
  const [saving, setSaving] = useState(false);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (user) loadToday();
  }, [user]);

  const loadToday = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('fitness_data')
      .select('steps, calories, workout_minutes')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle();

    if (data) setToday(data);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from('fitness_data')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      date: todayStr,
      steps: parseInt(form.steps) || 0,
      calories: parseInt(form.calories) || 0,
      workout_minutes: parseInt(form.workout_minutes) || 0,
      source: 'manual',
    };

    if (existing) {
      await supabase.from('fitness_data').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('fitness_data').insert(payload);
    }

    setSaving(false);
    setLogOpen(false);
    setForm({ steps: '', calories: '', workout_minutes: '' });
    loadToday();
  };

  const stepsPercent = Math.min((today.steps / 10000) * 100, 100);
  const calPercent = Math.min((today.calories / 2000) * 100, 100);
  const minPercent = Math.min((today.workout_minutes / 60) * 100, 100);

  return (
    <>
      <Card className="h-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/60 dark:border-emerald-800/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Footprints className="w-5 h-5" />
              健身追踪
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={() => setLogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatRing value={today.steps} label="步数" unit="步" max={10000} percent={stepsPercent} color="emerald" icon={<Footprints className="w-4 h-4" />} />
            <StatRing value={today.calories} label="卡路里" unit="千卡" max={2000} percent={calPercent} color="orange" icon={<Flame className="w-4 h-4" />} />
            <StatRing value={today.workout_minutes} label="运动" unit="分钟" max={60} percent={minPercent} color="blue" icon={<Timer className="w-4 h-4" />} />
          </div>

          <div className="space-y-2">
            <ActivityBar label="步数目标" percent={stepsPercent} color="bg-emerald-500" />
            <ActivityBar label="卡路里目标" percent={calPercent} color="bg-orange-500" />
            <ActivityBar label="运动目标" percent={minPercent} color="bg-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              记录今日健身数据
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>步数</Label>
              <Input type="number" placeholder="0" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>卡路里（千卡）</Label>
              <Input type="number" placeholder="0" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>运动时间（分钟）</Label>
              <Input type="number" placeholder="0" value={form.workout_minutes} onChange={(e) => setForm({ ...form, workout_minutes: e.target.value })} />
            </div>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存记录'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatRing({ value, label, unit, percent, color, icon }: {
  value: number; label: string; unit: string; max: number; percent: number; color: string; icon: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    orange: 'text-orange-600 dark:text-orange-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${colorMap[color]} mb-0.5`}>{icon}</div>
      <span className={`text-lg font-bold ${colorMap[color]}`}>{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function ActivityBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
