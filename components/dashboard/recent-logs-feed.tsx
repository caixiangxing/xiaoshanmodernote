'use client';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FileText, Smile, Activity, ArrowRight } from 'lucide-react';
import { Note, Category } from '@/lib/supabase';
import { getPlainTextFromHtml } from '@/lib/word-count';
import { cn } from '@/lib/utils';

interface MoodLog {
  id: string;
  logged_at: string;
  mood_score: number;
  notes?: string;
}

interface FitnessEntry {
  id: string;
  date: string;
  steps: number;
  calories: number;
  workout_minutes: number;
}

interface LogItem {
  type: 'note' | 'mood' | 'fitness';
  timestamp: string;
  data: any;
}

interface Props {
  notes: (Note & { category?: Category })[];
  moodLogs: MoodLog[];
  fitnessEntries: FitnessEntry[];
}

const MOOD_CONFIG = [
  { max: 2, label: '很差', emoji: '😢', color: 'text-red-500', dot: 'bg-red-500' },
  { max: 4, label: '较差', emoji: '😔', color: 'text-orange-500', dot: 'bg-orange-500' },
  { max: 6, label: '一般', emoji: '😐', color: 'text-amber-500', dot: 'bg-amber-500' },
  { max: 8, label: '良好', emoji: '🙂', color: 'text-blue-500', dot: 'bg-blue-500' },
  { max: 10, label: '很棒', emoji: '😄', color: 'text-emerald-500', dot: 'bg-emerald-500' },
];

function getMoodConfig(score: number) {
  return MOOD_CONFIG.find((c) => score <= c.max) ?? MOOD_CONFIG[MOOD_CONFIG.length - 1];
}

export function RecentLogsFeed({ notes, moodLogs, fitnessEntries }: Props) {
  const items: LogItem[] = [
    ...notes.map((n) => ({ type: 'note' as const, timestamp: n.updated_at, data: n })),
    ...moodLogs.map((m) => ({ type: 'mood' as const, timestamp: m.logged_at, data: m })),
    ...fitnessEntries.map((f) => ({ type: 'fitness' as const, timestamp: f.date, data: f })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border rounded-2xl bg-white/40 dark:bg-slate-900/40">
        <FileText className="w-8 h-8 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-sm">暂无近期记录</p>
          <p className="text-xs text-muted-foreground mt-0.5">记录笔记、心情或健身数据后将在此显示</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        if (item.type === 'note') {
          const note = item.data as Note & { category?: Category };
          const preview = getPlainTextFromHtml(note.content)?.slice(0, 80);
          return (
            <Link key={`note-${note.id}`} href={`/notes/${note.id}`}>
              <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-150">
                <div className="shrink-0 p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {note.title || '无标题笔记'}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {format(new Date(note.updated_at), 'MM/dd HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                  {preview && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
                  )}
                </div>
                {note.category && (
                  <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">{note.category.name}</Badge>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />
              </div>
            </Link>
          );
        }

        if (item.type === 'mood') {
          const mood = item.data as MoodLog;
          const config = getMoodConfig(mood.mood_score);
          return (
            <Link key={`mood-${mood.id}`} href="/mood">
              <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-150">
                <div className="shrink-0 p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Smile className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      心情记录
                      <span className={cn('ml-1.5 text-xs', config.color)}>
                        {config.emoji} {config.label}
                      </span>
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {format(new Date(mood.logged_at), 'MM/dd HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                  {mood.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{mood.notes}</p>
                  )}
                </div>
                <div className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />
              </div>
            </Link>
          );
        }

        if (item.type === 'fitness') {
          const fit = item.data as FitnessEntry;
          const isHighlight = fit.steps >= 8000 || fit.workout_minutes >= 45;
          return (
            <Link key={`fit-${fit.id}`} href="/health">
              <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-150">
                <div className="shrink-0 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-medium text-sm">健身记录</p>
                      {isHighlight && (
                        <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0 py-0 hidden sm:flex">
                          达标
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{fit.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fit.steps.toLocaleString()} 步 · {fit.calories} 千卡 · {fit.workout_minutes} 分钟
                  </p>
                </div>
              </div>
            </Link>
          );
        }

        return null;
      })}
    </div>
  );
}
