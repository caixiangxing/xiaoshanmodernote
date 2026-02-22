'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, Plus, Clock, AlertTriangle } from 'lucide-react';
import { supabase, MedicationPlan } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { SensitiveWrapper } from './sensitive-wrapper';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MedicationManager } from '@/components/medication-manager';

export function MedicationWidget() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MedicationPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const loadPlans = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('medication_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadPlans();
  }, [user]);

  const getNextDose = (times: string[]) => {
    if (!times || times.length === 0) return null;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    for (const t of times) {
      const [h, m] = t.split(':').map(Number);
      const tMinutes = h * 60 + m;
      if (tMinutes > nowMinutes) return t;
    }
    return times[0];
  };

  const isLowStock = (plan: MedicationPlan) => plan.total_pills <= plan.refill_threshold;

  return (
    <>
      <Card className="h-full bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/60 dark:border-violet-800/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <Pill className="w-5 h-5" />
              用药管理
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-violet-600" onClick={() => setManageOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SensitiveWrapper label="用药信息受隐私保护">
            <div className="space-y-2">
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500" />
                </div>
              )}
              {!loading && plans.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <Pill className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">暂无活跃用药计划</p>
                  <Button size="sm" variant="outline" onClick={() => setManageOpen(true)}>
                    添加用药
                  </Button>
                </div>
              )}
              {plans.map((plan) => {
                const nextDose = getNextDose(plan.times);
                const lowStock = isLowStock(plan);
                return (
                  <div
                    key={plan.id}
                    className="flex items-center gap-3 p-2.5 bg-white/60 dark:bg-slate-800/40 rounded-lg"
                  >
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                      <Pill className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{plan.name}</p>
                        {lowStock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.dosage} · {plan.frequency}</p>
                    </div>
                    {nextDose && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        {nextDose}
                      </div>
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${lowStock ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'}`}
                    >
                      {plan.total_pills} 片
                    </Badge>
                  </div>
                );
              })}
            </div>
          </SensitiveWrapper>
        </CardContent>
      </Card>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <MedicationManager />
        </DialogContent>
      </Dialog>
    </>
  );
}
