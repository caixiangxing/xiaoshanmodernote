'use client';

import { useState } from 'react';
import { Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePinLock } from '@/lib/pin-lock-context';
import { PinUnlockModal } from './pin-unlock-modal';
import { cn } from '@/lib/utils';

interface SensitiveWrapperProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function SensitiveWrapper({ children, label = '敏感数据', className }: SensitiveWrapperProps) {
  const { isUnlocked } = usePinLock();
  const [modalOpen, setModalOpen] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  if (isUnlocked || justUnlocked) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={cn('relative rounded-xl overflow-hidden', className)}>
        <div className="blur-sm pointer-events-none select-none" aria-hidden>
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full">
              <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
            <p className="text-xs text-muted-foreground">点击解锁查看受保护内容</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            onClick={() => setModalOpen(true)}
          >
            <Eye className="w-4 h-4" />
            输入 PIN 解锁
          </Button>
        </div>
      </div>

      <PinUnlockModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => setJustUnlocked(true)}
      />
    </>
  );
}
