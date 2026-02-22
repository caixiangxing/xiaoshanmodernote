'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wind, X } from 'lucide-react';

const phases = [
  { name: '吸气', duration: 4, instruction: '深深吸气...', color: 'from-blue-400 to-cyan-400' },
  { name: '屏息', duration: 4, instruction: '保持住...', color: 'from-purple-400 to-blue-400' },
  { name: '呼气', duration: 6, instruction: '慢慢呼出...', color: 'from-pink-400 to-purple-400' },
  { name: '放松', duration: 2, instruction: '放松身心...', color: 'from-green-400 to-teal-400' },
];

export function BreathingExercise({ onClose }: { onClose: () => void }) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [countdown, setCountdown] = useState(phases[0].duration);
  const [isRunning, setIsRunning] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const nextPhase = (currentPhase + 1) % phases.length;
          setCurrentPhase(nextPhase);

          if (nextPhase === 0) {
            setCycleCount((c) => c + 1);
          }

          return phases[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPhase, isRunning]);

  const phase = phases[currentPhase];
  const progress = ((phases[currentPhase].duration - countdown) / phases[currentPhase].duration) * 100;
  const scale = currentPhase === 0 ? 1 + (progress / 100) * 0.5 : currentPhase === 2 ? 1.5 - (progress / 100) * 0.5 : 1.25;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50/90 via-blue-50/90 to-pink-50/90 dark:from-purple-950/50 dark:via-blue-950/50 dark:to-pink-950/50 backdrop-blur-xl border-purple-200 dark:border-purple-800 shadow-2xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10"
      >
        <X className="w-4 h-4" />
      </Button>

      <CardContent className="py-16 px-8">
        <div className="text-center space-y-8">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
              <Wind className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="relative flex items-center justify-center" style={{ height: '300px' }}>
            <div
              className={`absolute w-48 h-48 rounded-full bg-gradient-to-br ${phase.color} opacity-50 blur-3xl transition-all duration-1000`}
              style={{ transform: `scale(${scale})` }}
            />
            <div
              className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center text-white shadow-2xl transition-all duration-1000`}
              style={{ transform: `scale(${scale})` }}
            >
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{countdown}</div>
                <div className="text-sm opacity-90">{phase.name}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-2xl font-medium">{phase.instruction}</p>
            <p className="text-sm text-muted-foreground">
              循环 {cycleCount + 1} 次 · 坚持 3-5 次循环效果最佳
            </p>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => setIsRunning(!isRunning)}
              className="min-w-[100px]"
            >
              {isRunning ? '暂停' : '继续'}
            </Button>
            {cycleCount >= 3 && (
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                完成练习
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
