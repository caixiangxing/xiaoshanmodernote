'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scale, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface VitalEntry {
  weight?: number;
  recorded_at: string;
}

export function BodyCompositionWidget() {
  const { user } = useAuth();
  const [latest, setLatest] = useState<VitalEntry | null>(null);
  const [previous, setPrevious] = useState<VitalEntry | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({ weight: '', height: '', body_fat: '' });
  const [saving, setSaving] = useState(false);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('vital_signs')
      .select('weight, recorded_at')
      .eq('user_id', user.id)
      .not('weight', 'is', null)
      .order('recorded_at', { ascending: false })
      .limit(2);

    if (data && data.length >= 1) setLatest(data[0]);
    if (data && data.length >= 2) setPrevious(data[1]);

    const storedHeight = localStorage.getItem('health_height');
    if (storedHeight) setHeight(parseFloat(storedHeight));
  };

  const bmi =
    latest?.weight && height
      ? (latest.weight / ((height / 100) * (height / 100))).toFixed(1)
      : null;

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5
      ? { label: '偏瘦', color: 'text-blue-500' }
      : parseFloat(bmi) < 24
      ? { label: '正常', color: 'text-emerald-500' }
      : parseFloat(bmi) < 28
      ? { label: '超重', color: 'text-amber-500' }
      : { label: '肥胖', color: 'text-red-500' }
    : null;

  const weightDelta =
    latest?.weight && previous?.weight ? latest.weight - previous.weight : null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    if (form.height) {
      localStorage.setItem('health_height', form.height);
      setHeight(parseFloat(form.height));
    }
    await supabase.from('vital_signs').insert({
      user_id: user.id,
      weight: form.weight ? parseFloat(form.weight) : null,
      recorded_at: new Date().toISOString(),
    });
    setSaving(false);
    setLogOpen(false);
    setForm({ weight: '', height: '', body_fat: '' });
    loadData();
  };

  return (
    <>
      <Card className="h-full bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200/60 dark:border-sky-800/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
              <Scale className="w-5 h-5" />
              体型管理
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-sky-600" onClick={() => setLogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-slate-800/40 rounded-xl p-3 space-y-1">
              <p className="text-xs text-muted-foreground">当前体重</p>
              <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                {latest?.weight ? `${latest.weight}` : '—'}
                <span className="text-sm font-normal ml-1 text-muted-foreground">kg</span>
              </p>
              {weightDelta !== null && (
                <div className={`flex items-center gap-1 text-xs ${weightDelta < 0 ? 'text-emerald-500' : weightDelta > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {weightDelta < 0 ? <TrendingDown className="w-3 h-3" /> : weightDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
                </div>
              )}
            </div>

            <div className="bg-white/60 dark:bg-slate-800/40 rounded-xl p-3 space-y-1">
              <p className="text-xs text-muted-foreground">BMI 指数</p>
              <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                {bmi ?? '—'}
              </p>
              {bmiCategory && (
                <p className={`text-xs font-medium ${bmiCategory.color}`}>{bmiCategory.label}</p>
              )}
            </div>
          </div>

          {bmi && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>BMI 范围参考</span>
                <span>{bmi}</span>
              </div>
              <div className="relative h-3 bg-gradient-to-r from-blue-300 via-emerald-400 via-amber-400 to-red-400 rounded-full">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-700 rounded-full shadow-md transition-all duration-500"
                  style={{ left: `${Math.min(Math.max(((parseFloat(bmi) - 15) / 25) * 100, 0), 97)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>15</span>
                <span>18.5</span>
                <span>24</span>
                <span>28</span>
                <span>40</span>
              </div>
            </div>
          )}

          {!latest && (
            <p className="text-sm text-muted-foreground text-center py-2">暂无数据，点击 + 开始记录</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-sky-500" />
              记录体型数据
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>体重（kg）</Label>
              <Input type="number" step="0.1" placeholder="70.0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>身高（cm，用于 BMI 计算）</Label>
              <Input type="number" placeholder={height ? String(height) : '175'} value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            </div>
            <Button className="w-full bg-sky-500 hover:bg-sky-600" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存记录'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
