'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Loader2, X, Sparkles,
  Activity, DollarSign, Smile, FileText, Check, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AIProcessor, ExtractionResult, ExtractedFinance, ExtractedHealth } from '@/lib/ai-processor';
import { cn } from '@/lib/utils';

interface Props {
  onConfirm: (text: string, result: ExtractionResult) => Promise<void>;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  food: '餐饮', transport: '交通', shopping: '购物', bills: '账单',
  fitness: '健身', entertainment: '娱乐', health: '医疗', education: '教育',
  salary: '工资', freelance: '自由职业', investment: '投资',
  income: '其他收入', other: '其他',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜', transport: '🚕', shopping: '🛍️', bills: '📄',
  fitness: '💪', entertainment: '🎬', health: '💊', education: '📚',
  salary: '💼', freelance: '💻', investment: '📈',
  income: '💰', other: '📦',
};

function healthLabel(h: ExtractedHealth): string[] {
  const parts: string[] = [];
  if (h.steps != null) parts.push(`${h.steps.toLocaleString()} 步`);
  if (h.workout_minutes != null) parts.push(`${h.workout_minutes} 分钟运动`);
  if (h.weight != null) parts.push(`体重 ${h.weight} kg`);
  if (h.sleep_hours != null) parts.push(`睡眠 ${h.sleep_hours} 小时`);
  if (h.calories != null) parts.push(`${h.calories} 千卡`);
  return parts;
}

function FinanceItemRow({
  item,
  index,
  checked,
  onChange,
}: {
  item: ExtractedFinance;
  index: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const isExpense = item.type === 'expense';
  const icon = CATEGORY_ICONS[item.category] ?? '💰';
  const label = CATEGORY_LABELS[item.category] ?? item.category;

  return (
    <label
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all',
        checked
          ? isExpense
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
            : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 opacity-60'
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
        className="shrink-0"
      />
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'text-sm font-semibold',
            isExpense ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'
          )}>
            {isExpense ? '-' : '+'}¥{item.amount.toFixed(2)}
          </span>
          <Badge className="text-xs border-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0">
            {label}
          </Badge>
        </div>
        {item.note && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.note}</p>
        )}
      </div>
      <span className={cn(
        'text-xs font-medium shrink-0',
        isExpense ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'
      )}>
        {isExpense ? '支出' : '收入'}
      </span>
    </label>
  );
}

function ConfirmationModal({
  open,
  text,
  result,
  selectedFinances,
  onToggleFinance,
  onConfirm,
  onCancel,
  saving,
}: {
  open: boolean;
  text: string;
  result: ExtractionResult;
  selectedFinances: boolean[];
  onToggleFinance: (index: number, val: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const displayFinances = result.finances.length > 0 ? result.finances : (result.finance ? [result.finance] : []);
  const hasData = result.health || displayFinances.length > 0 || result.mood;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            确认保存内容
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">原文</p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{text}</p>
          </div>

          {hasData && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">识别到的数据</p>

              {result.health && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-3">
                  <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">健康数据</p>
                    <div className="flex flex-wrap gap-1.5">
                      {healthLabel(result.health).map((l) => (
                        <Badge key={l} className="text-xs bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-0">
                          {l}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-1.5">→ 将保存到健康记录</p>
                  </div>
                </div>
              )}

              {displayFinances.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground px-0.5">
                    财务记录（勾选需要保存的条目）
                  </p>
                  {displayFinances.map((fin, i) => (
                    <FinanceItemRow
                      key={i}
                      item={fin}
                      index={i}
                      checked={selectedFinances[i] ?? true}
                      onChange={(v) => onToggleFinance(i, v)}
                    />
                  ))}
                </div>
              )}

              {result.mood && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-3">
                  <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <Smile className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">心情识别</p>
                    <Badge className="text-xs border-0 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      {result.mood.label} · {result.mood.score}/10
                    </Badge>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1.5">→ 将保存到心情日志</p>
                  </div>
                </div>
              )}

              {result.hasNarrative && (
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3.5 py-3">
                  <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">日记内容</p>
                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80 line-clamp-2">{result.narrative}</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-1.5">→ 将保存到笔记</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasData && !result.hasNarrative && (
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">将作为普通笔记保存</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
            返回修改
          </Button>
          <Button onClick={onConfirm} disabled={saving} className="flex-1 gap-1.5">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />保存中…</>
              : <><Check className="w-4 h-4" />确认保存</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OmniInput({ onConfirm, placeholder = '输入你的想法、活动或消费…', className }: Props) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExtractionResult | null>(null);
  const [selectedFinances, setSelectedFinances] = useState<boolean[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const toggleRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const newText = text ? `${text} ${transcript}` : transcript;
      setText(newText);
    };

    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const handleAnalyzeAndPreview = () => {
    if (!text.trim()) return;
    const result = AIProcessor.analyze(text.trim());
    const displayFinances = result.finances.length > 0 ? result.finances : (result.finance ? [result.finance] : []);
    setPendingResult(result);
    setSelectedFinances(displayFinances.map(() => true));
    setShowModal(true);
  };

  const handleToggleFinance = (index: number, val: boolean) => {
    setSelectedFinances((prev) => prev.map((v, i) => (i === index ? val : v)));
  };

  const handleFinalConfirm = async () => {
    if (!pendingResult || saving) return;
    setSaving(true);

    const displayFinances = pendingResult.finances.length > 0
      ? pendingResult.finances
      : (pendingResult.finance ? [pendingResult.finance] : []);
    const filteredFinances = displayFinances.filter((_, i) => selectedFinances[i] !== false);

    const effectiveResult: ExtractionResult = {
      ...pendingResult,
      finances: filteredFinances,
      finance: filteredFinances[0] ?? null,
    };

    console.log('Extracted Data:', effectiveResult);

    try {
      await onConfirm(text.trim(), effectiveResult);
      setText('');
      setPendingResult(null);
      setSelectedFinances([]);
      setShowModal(false);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingResult(null);
    setSelectedFinances([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAnalyzeAndPreview();
    }
  };

  const hasContent = text.trim().length > 0;

  return (
    <>
      <div className={cn('relative', className)}>
        <div className={cn(
          'rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md transition-all duration-200',
          expanded ? 'border-blue-300 dark:border-blue-700 shadow-blue-100/50 dark:shadow-blue-950/30' : 'border-slate-200/80 dark:border-slate-700',
          recording && 'border-red-400 dark:border-red-600'
        )}>
          <div className="p-3">
            {recording && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex gap-0.5 items-end h-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-red-500 rounded-full"
                      style={{
                        height: `${50 + (i % 2) * 40}%`,
                        animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-red-500 font-medium">正在录音…</p>
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setExpanded(true)}
              placeholder={placeholder}
              className={cn(
                'min-h-[52px] max-h-40 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm text-white placeholder:text-white/50',
                expanded ? 'min-h-[88px]' : ''
              )}
            />

            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                {voiceSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 w-8 p-0 rounded-full transition-colors',
                      recording
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 hover:bg-red-200'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                    onClick={toggleRecording}
                    title={recording ? '停止录音' : '语音输入'}
                  >
                    {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
                <span className="text-xs text-white/40 hidden sm:block">Ctrl+Enter 提交</span>
              </div>

              <div className="flex items-center gap-2">
                {hasContent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full text-white/40 hover:text-white hover:bg-white/10"
                    onClick={() => {
                      setText('');
                      setExpanded(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    'h-8 px-3.5 gap-1.5 text-xs font-semibold rounded-xl transition-all duration-150',
                    hasContent
                      ? 'bg-white text-slate-900 hover:bg-white/90 shadow-sm'
                      : 'bg-white/20 text-white/40 pointer-events-none'
                  )}
                  onClick={handleAnalyzeAndPreview}
                  disabled={!hasContent}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  分析并保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingResult && (
        <ConfirmationModal
          open={showModal}
          text={text}
          result={pendingResult}
          selectedFinances={selectedFinances}
          onToggleFinance={handleToggleFinance}
          onConfirm={handleFinalConfirm}
          onCancel={handleCancel}
          saving={saving}
        />
      )}
    </>
  );
}
