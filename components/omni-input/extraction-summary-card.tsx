'use client';

import { ExtractionResult, ExtractedFinance } from '@/lib/ai-processor';
import { Badge } from '@/components/ui/badge';
import { Activity, DollarSign, Smile, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  result: ExtractionResult;
  originalText: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  food: '餐饮',
  transport: '交通',
  shopping: '购物',
  bills: '账单',
  fitness: '健身',
  entertainment: '娱乐',
  income: '收入',
  other: '其他',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜', transport: '🚕', shopping: '🛍️', bills: '📄',
  fitness: '💪', entertainment: '🎬', health: '💊', education: '📚',
  salary: '💼', freelance: '💻', investment: '📈',
  income: '💰', other: '📦',
};

function FinanceBadgeRow({ f }: { f: ExtractedFinance }) {
  const isExpense = f.type === 'expense';
  const icon = CATEGORY_ICONS[f.category] ?? '💰';
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs">{icon}</span>
      <Badge variant="secondary" className={cn('text-xs', isExpense ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800')}>
        {isExpense ? '-' : '+'}¥{f.amount.toFixed(2)}
      </Badge>
      <Badge variant="secondary" className="text-xs">
        {CATEGORY_LABELS[f.category] ?? f.category}
      </Badge>
    </div>
  );
}

export function ExtractionSummaryCard({ result, originalText }: Props) {
  const sections: React.ReactNode[] = [];

  if (result.health) {
    const h = result.health;
    const items = [
      h.steps != null && `${h.steps.toLocaleString()} 步`,
      h.workout_minutes != null && `${h.workout_minutes} 分钟运动`,
      h.weight != null && `体重 ${h.weight} kg`,
      h.calories != null && `${h.calories} 千卡`,
    ].filter(Boolean) as string[];

    sections.push(
      <div key="health" className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
          <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">健康数据</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayFinances = result.finances.length > 0 ? result.finances : (result.finance ? [result.finance] : []);
  if (displayFinances.length > 0) {
    const firstIsExpense = displayFinances[0].type === 'expense';
    sections.push(
      <div key="finance" className="flex items-start gap-3">
        <div className={cn('shrink-0 mt-0.5 p-1.5 rounded-lg', firstIsExpense ? 'bg-red-100 dark:bg-red-900/40' : 'bg-blue-100 dark:bg-blue-900/40')}>
          <DollarSign className={cn('w-3.5 h-3.5', firstIsExpense ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400')} />
        </div>
        <div className="space-y-1">
          <p className={cn('text-xs font-semibold mb-0.5', firstIsExpense ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400')}>
            {displayFinances.length > 1 ? `财务记录 (${displayFinances.length} 条)` : (firstIsExpense ? '支出' : '收入')}
          </p>
          {displayFinances.map((f, i) => (
            <FinanceBadgeRow key={i} f={f} />
          ))}
        </div>
      </div>
    );
  }

  if (result.mood) {
    sections.push(
      <div key="mood" className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
          <Smile className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">心情</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              {result.mood.label} ({result.mood.score}/10)
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  if (result.hasNarrative) {
    sections.push(
      <div key="narrative" className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">日记内容</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{result.narrative}</p>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">将作为日记保存</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">识别到的数据</p>
      </div>
      <div className="p-3 space-y-3">
        {sections}
      </div>
    </div>
  );
}
