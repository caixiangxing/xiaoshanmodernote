'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Delete } from 'lucide-react';
import { usePinLock } from '@/lib/pin-lock-context';
import { cn } from '@/lib/utils';

interface PinUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PinUnlockModal({ open, onOpenChange, onSuccess }: PinUnlockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const { unlock } = usePinLock();

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);

    if (next.length === 4) {
      setTimeout(() => {
        const success = unlock(next);
        if (success) {
          setPin('');
          setError(false);
          onOpenChange(false);
          onSuccess();
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Lock className="w-5 h-5 text-amber-500" />
            输入访问密码
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 pt-2">
          <p className="text-sm text-muted-foreground text-center">
            此内容受隐私保护，请输入 4 位 PIN 码解锁（会话有效期 5 分钟）
          </p>

          <div className={cn('flex gap-3', shake && 'animate-[shake_0.5s_ease-in-out]')}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all duration-150',
                  pin.length > i
                    ? error
                      ? 'bg-red-500 border-red-500'
                      : 'bg-slate-800 dark:bg-white border-slate-800 dark:border-white'
                    : 'border-slate-300 dark:border-slate-600'
                )}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500 -mt-2">PIN 码错误，请重试</p>
          )}

          <div className="grid grid-cols-3 gap-3 w-full">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;
              if (d === 'del') {
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    className="h-14 text-lg font-medium rounded-xl"
                    onClick={handleDelete}
                    disabled={pin.length === 0}
                  >
                    <Delete className="w-5 h-5" />
                  </Button>
                );
              }
              return (
                <Button
                  key={i}
                  variant="outline"
                  className="h-14 text-xl font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-transform"
                  onClick={() => handleDigit(d)}
                >
                  {d}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
