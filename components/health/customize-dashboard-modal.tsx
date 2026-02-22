'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings2, Footprints, Scale, FileText, Pill, Sparkles } from 'lucide-react';
import { WidgetId, WIDGET_CONFIGS } from './widget-config';

interface CustomizeDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleWidgets: Record<WidgetId, boolean>;
  onToggle: (id: WidgetId) => void;
}

export function CustomizeDashboardModal({
  open,
  onOpenChange,
  visibleWidgets,
  onToggle,
}: CustomizeDashboardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-slate-600" />
            自定义仪表盘
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          <p className="text-sm text-muted-foreground pb-3">
            选择您想在健康日志仪表盘上显示的组件。
          </p>
          {WIDGET_CONFIGS.map((widget) => {
            const Icon = widget.icon;
            return (
              <div
                key={widget.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${widget.bgColor}`}>
                    <Icon className={`w-4 h-4 ${widget.iconColor}`} />
                  </div>
                  <div>
                    <Label htmlFor={`toggle-${widget.id}`} className="font-medium cursor-pointer">
                      {widget.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{widget.description}</p>
                  </div>
                </div>
                <Switch
                  id={`toggle-${widget.id}`}
                  checked={visibleWidgets[widget.id]}
                  onCheckedChange={() => onToggle(widget.id)}
                />
              </div>
            );
          })}
        </div>
        <Button className="w-full mt-2" onClick={() => onOpenChange(false)}>
          完成
        </Button>
      </DialogContent>
    </Dialog>
  );
}
