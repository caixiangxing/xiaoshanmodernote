'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, Lock, Shield, Activity } from 'lucide-react';
import { FitnessWidget } from '@/components/health/fitness-widget';
import { BodyCompositionWidget } from '@/components/health/body-composition-widget';
import { MedicalRecordsWidget } from '@/components/health/medical-records-widget';
import { MedicationWidget } from '@/components/health/medication-widget';
import { HealthIndexWidget } from '@/components/health/health-index-widget';
import { CustomizeDashboardModal } from '@/components/health/customize-dashboard-modal';
import { PinLockProvider, usePinLock } from '@/lib/pin-lock-context';
import { WidgetId, DEFAULT_VISIBLE, WIDGET_CONFIGS } from '@/components/health/widget-config';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'health_widget_preferences';

function HealthDashboard() {
  const { isUnlocked, lock } = usePinLock();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<WidgetId, boolean>>(DEFAULT_VISIBLE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setVisibleWidgets({ ...DEFAULT_VISIBLE, ...JSON.parse(saved) });
      } catch {}
    }
  }, []);

  const handleToggle = (id: WidgetId) => {
    const next = { ...visibleWidgets, [id]: !visibleWidgets[id] };
    setVisibleWidgets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const visibleCount = Object.values(visibleWidgets).filter(Boolean).length;

  const sensitiveUnlocked = isUnlocked;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">健康日志</h1>
            </div>
            <p className="text-muted-foreground pl-1">全方位健康数据管理与隐私保护</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {sensitiveUnlocked && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={lock}
              >
                <Lock className="w-4 h-4" />
                锁定敏感数据
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setCustomizeOpen(true)}
            >
              <Settings2 className="w-4 h-4" />
              自定义仪表盘
              <Badge variant="secondary" className="ml-1 text-xs">
                {visibleCount}/{WIDGET_CONFIGS.length}
              </Badge>
            </Button>
          </div>
        </div>

        {!sensitiveUnlocked && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-sm text-amber-800 dark:text-amber-300">
            <Shield className="w-4 h-4 shrink-0" />
            <span>
              <strong>隐私保护模式已启用</strong> — 医疗档案与用药信息默认隐藏。点击对应组件输入 PIN 码解锁（会话有效期 5 分钟）。
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleWidgets.healthIndex && (
            <div className={cn('md:col-span-2 xl:col-span-1')}>
              <HealthIndexWidget />
            </div>
          )}
          {visibleWidgets.fitness && (
            <div>
              <FitnessWidget />
            </div>
          )}
          {visibleWidgets.body && (
            <div>
              <BodyCompositionWidget />
            </div>
          )}
          {visibleWidgets.medical && (
            <div className="md:col-span-2 xl:col-span-1">
              <MedicalRecordsWidget />
            </div>
          )}
          {visibleWidgets.medication && (
            <div className="md:col-span-2 xl:col-span-1">
              <MedicationWidget />
            </div>
          )}
        </div>

        {visibleCount === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <Settings2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">所有组件已隐藏</p>
              <p className="text-sm text-muted-foreground mt-1">点击"自定义仪表盘"重新添加</p>
            </div>
            <Button onClick={() => setCustomizeOpen(true)}>自定义仪表盘</Button>
          </div>
        )}
      </div>

      <CustomizeDashboardModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        visibleWidgets={visibleWidgets}
        onToggle={handleToggle}
      />
    </AppLayout>
  );
}

export default function HealthPage() {
  return (
    <PinLockProvider>
      <HealthDashboard />
    </PinLockProvider>
  );
}
