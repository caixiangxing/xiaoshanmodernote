'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Target, RotateCcw, Save } from 'lucide-react';
import { LifeGoals, DEFAULT_GOALS, GOAL_META } from '@/lib/life-goals';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goals: LifeGoals;
  saving: boolean;
  onSave: (goals: LifeGoals) => void;
}

export function SetGoalsModal({ open, onOpenChange, goals, saving, onSave }: Props) {
  const [draft, setDraft] = useState<LifeGoals>(goals);

  const handleOpen = (v: boolean) => {
    if (v) setDraft(goals);
    onOpenChange(v);
  };

  const update = (key: keyof LifeGoals, value: number) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleReset = () => setDraft(DEFAULT_GOALS);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <SheetTitle>设定个人目标</SheetTitle>
              <SheetDescription>调整目标后，图表将立即重新计算指数</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {GOAL_META.map((meta) => {
            const value = draft[meta.key];
            const isChanged = value !== DEFAULT_GOALS[meta.key];
            return (
              <div key={meta.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    {meta.label}
                    {isChanged && (
                      <Badge variant="secondary" className="text-xs py-0">
                        已修改
                      </Badge>
                    )}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={value}
                      min={meta.min}
                      max={meta.max}
                      step={meta.step}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) update(meta.key, v);
                      }}
                      className="w-24 h-8 text-right text-sm"
                    />
                    <span className="text-xs text-muted-foreground w-14">{meta.unit}</span>
                  </div>
                </div>
                <Slider
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={[value]}
                  onValueChange={([v]) => update(meta.key, v)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
            恢复默认
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中…' : '保存目标'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
