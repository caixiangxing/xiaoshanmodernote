'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pill, Plus, Clock, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface MedicationPlan {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  total_pills: number;
  refill_threshold: number;
  active: boolean;
}

export function MedicationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<MedicationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: [''],
    total_pills: 30,
    refill_threshold: 5,
  });

  useEffect(() => {
    if (user) {
      loadMedications();
    }
  }, [user]);

  const loadMedications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medication_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async () => {
    if (!user || !newMed.name || !newMed.dosage) {
      toast({ title: '请填写必要信息', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('medication_plans').insert({
        user_id: user.id,
        name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        times: newMed.times.filter((t) => t.trim() !== ''),
        total_pills: newMed.total_pills,
        refill_threshold: newMed.refill_threshold,
        active: true,
      });

      if (error) throw error;

      toast({ title: '用药计划已添加' });
      setShowAddDialog(false);
      setNewMed({
        name: '',
        dosage: '',
        frequency: '',
        times: [''],
        total_pills: 30,
        refill_threshold: 5,
      });
      loadMedications();
    } catch (error: any) {
      toast({ title: '添加失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleTakeMedication = async (med: MedicationPlan) => {
    if (!user) return;

    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      await supabase.from('medication_logs').insert({
        user_id: user.id,
        medication_plan_id: med.id,
        scheduled_time: currentTime,
      });

      const newPillCount = med.total_pills - 1;
      await supabase
        .from('medication_plans')
        .update({
          total_pills: newPillCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', med.id);

      toast({ title: '已记录服药', description: `${med.name} - ${med.dosage}` });
      loadMedications();
    } catch (error: any) {
      toast({ title: '记录失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (!user) return;

    try {
      await supabase
        .from('medication_plans')
        .update({ active: false })
        .eq('id', id);

      toast({ title: '用药计划已删除' });
      loadMedications();
    } catch (error: any) {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    }
  };

  const getNextDoseTime = (times: string[]) => {
    if (!times || times.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const futureTimes = times
      .map((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      })
      .filter((timeInMinutes) => timeInMinutes > currentMinutes)
      .sort((a, b) => a - b);

    if (futureTimes.length > 0) {
      const nextTime = futureTimes[0];
      const hours = Math.floor(nextTime / 60);
      const minutes = nextTime % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return times[0];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                用药管理
              </CardTitle>
              <CardDescription>跟踪用药计划和库存</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              添加用药
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-slate-500">加载中...</p>
          ) : medications.length === 0 ? (
            <p className="text-center text-slate-500">暂无用药计划</p>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => {
                const needsRefill = med.total_pills <= med.refill_threshold;
                const nextDose = getNextDoseTime(med.times);

                return (
                  <div
                    key={med.id}
                    className="p-4 border rounded-lg space-y-3 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{med.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {med.dosage} · {med.frequency}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMedication(med.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {needsRefill && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          药品库存不足：剩余 {med.total_pills} 粒，请尽快补充
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        下次服药时间：{nextDose || '未设置'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline">剩余 {med.total_pills} 粒</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleTakeMedication(med)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        标记已服用
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加用药计划</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>药品名称</Label>
              <Input
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                placeholder="例如：二甲双胍"
              />
            </div>

            <div>
              <Label>剂量</Label>
              <Input
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                placeholder="例如：500mg"
              />
            </div>

            <div>
              <Label>频率</Label>
              <Input
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                placeholder="例如：每日两次"
              />
            </div>

            <div>
              <Label>服药时间</Label>
              {newMed.times.map((time, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newTimes = [...newMed.times];
                      newTimes[index] = e.target.value;
                      setNewMed({ ...newMed, times: newTimes });
                    }}
                  />
                  {index === newMed.times.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNewMed({ ...newMed, times: [...newMed.times, ''] })
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <Label>总药量（粒）</Label>
              <Input
                type="number"
                value={newMed.total_pills}
                onChange={(e) =>
                  setNewMed({ ...newMed, total_pills: parseInt(e.target.value) })
                }
              />
            </div>

            <div>
              <Label>库存预警阈值（粒）</Label>
              <Input
                type="number"
                value={newMed.refill_threshold}
                onChange={(e) =>
                  setNewMed({ ...newMed, refill_threshold: parseInt(e.target.value) })
                }
              />
            </div>

            <Button onClick={handleAddMedication} className="w-full">
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
