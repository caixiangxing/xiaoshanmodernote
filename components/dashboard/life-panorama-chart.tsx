'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Settings2, TrendingUp, Calendar, Target } from 'lucide-react';
import { DayData } from '@/lib/life-indices';
import { LifeGoals } from '@/lib/life-goals';
import { SetGoalsModal } from './set-goals-modal';
import { cn } from '@/lib/utils';

const LINES = [
  { key: 'moodIndex', label: '情绪指数', color: '#f59e0b', rawKey: 'rawMood', rawUnit: '/10' },
  { key: 'creationIndex', label: '创作指数', color: '#3b82f6', rawKey: 'rawWords', rawUnit: '字' },
  { key: 'learningIndex', label: '学习指数', color: '#10b981', rawKey: null, rawUnit: null },
  { key: 'healthIndex', label: '健康指数', color: '#ef4444', rawKey: 'rawSteps', rawUnit: '步' },
  { key: 'financeIndex', label: '财务指数', color: '#8b5cf6', rawKey: 'rawSpend', rawUnit: '元' },
] as const;

type LineKey = (typeof LINES)[number]['key'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  data: DayData[];
}

function CustomTooltip({ active, payload, label, data }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dayData = data.find((d) => d.dateLabel === label);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl min-w-[180px]">
      <p className="font-semibold text-sm mb-2 text-slate-600 dark:text-slate-400">{label}</p>
      {payload.map((entry: any) => {
        const line = LINES.find((l) => l.key === entry.dataKey);
        if (!line || entry.value == null) return null;
        const rawVal = line.rawKey ? dayData?.[line.rawKey as keyof DayData] : null;
        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.stroke }} />
              <span className="text-muted-foreground">{line.label}</span>
            </div>
            <div className="text-right font-medium">
              <span style={{ color: entry.stroke }}>{Math.round(entry.value)}</span>
              <span className="text-muted-foreground ml-0.5 text-[10px]">分</span>
              {rawVal != null && line.rawUnit && (
                <span className="text-muted-foreground ml-1.5 font-normal">
                  ({String(rawVal)}{line.rawUnit})
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  data: DayData[];
  range: 7 | 30;
  onRangeChange: (r: 7 | 30) => void;
  goals: LifeGoals;
  onSaveGoals: (g: LifeGoals) => void;
  savingGoals: boolean;
}

export function LifePanoramaChart({ data, range, onRangeChange, goals, onSaveGoals, savingGoals }: Props) {
  const [hiddenLines, setHiddenLines] = useState<Set<LineKey>>(new Set());
  const [configLines, setConfigLines] = useState<Set<LineKey>>(new Set());
  const [goalsOpen, setGoalsOpen] = useState(false);

  const toggleLine = (key: LineKey) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleConfig = (key: LineKey) => {
    setConfigLines((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const visibleLines = LINES.filter((l) => !configLines.has(l.key));
  const hasAnyData = data.some(
    (d) => d.moodIndex != null || d.creationIndex != null || d.learningIndex != null || d.healthIndex != null
  );

  return (
    <>
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl shadow-lg border-slate-200/60 dark:border-slate-700/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-xl">生命全景图</CardTitle>
              </div>
              <CardDescription className="mt-0.5">
                情绪、创作、学习、健康 — 基于个人目标标准化为 0-100 指数
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => onRangeChange(r)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1',
                      range === r
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {r}天
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                onClick={() => setGoalsOpen(true)}
              >
                <Target className="w-4 h-4" />
                设定目标
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>显示指数</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {LINES.map((line) => (
                    <DropdownMenuCheckboxItem
                      key={line.key}
                      checked={!configLines.has(line.key)}
                      onCheckedChange={() => toggleConfig(line.key)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                        {line.label}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {visibleLines.map((line) => (
              <button
                key={line.key}
                onClick={() => toggleLine(line.key)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                  hiddenLines.has(line.key)
                    ? 'border-slate-200 dark:border-slate-700 text-muted-foreground opacity-50'
                    : 'border-transparent text-white'
                )}
                style={!hiddenLines.has(line.key) ? { backgroundColor: line.color } : {}}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: hiddenLines.has(line.key) ? line.color : 'white' }}
                />
                {line.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {!hasAnyData ? (
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <TrendingUp className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">暂无数据</p>
                <p className="text-sm text-muted-foreground mt-1">
                  开始记录心情、笔记或健身数据，图表将在此处显示
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip content={<CustomTooltip data={data} />} />
                {visibleLines.map((line) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    stroke={line.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: line.color, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    name={line.label}
                    connectNulls
                    hide={hiddenLines.has(line.key)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <SetGoalsModal
        open={goalsOpen}
        onOpenChange={setGoalsOpen}
        goals={goals}
        saving={savingGoals}
        onSave={onSaveGoals}
      />
    </>
  );
}
