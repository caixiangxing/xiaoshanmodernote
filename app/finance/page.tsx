'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { supabase, FinanceTransaction } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { usePinLock } from '@/lib/pin-lock-context';
import { SensitiveWrapper } from '@/components/health/sensitive-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Plus,
  Wallet,
  Lock,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: '餐饮' },
  { value: 'transport', label: '交通' },
  { value: 'shopping', label: '购物' },
  { value: 'bills', label: '账单' },
  { value: 'fitness', label: '健身' },
  { value: 'entertainment', label: '娱乐' },
  { value: 'health', label: '医疗' },
  { value: 'education', label: '教育' },
  { value: 'other', label: '其他' },
];

const INCOME_CATEGORIES = [
  { value: 'salary', label: '工资' },
  { value: 'freelance', label: '自由职业' },
  { value: 'investment', label: '投资' },
  { value: 'gift', label: '礼金' },
  { value: 'income', label: '其他收入' },
];

const CATEGORY_LABELS: Record<string, string> = {
  food: '餐饮', transport: '交通', shopping: '购物', bills: '账单',
  fitness: '健身', entertainment: '娱乐', health: '医疗', education: '教育',
  other: '其他', salary: '工资', freelance: '自由职业', investment: '投资',
  gift: '礼金', income: '其他收入',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  transport: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  bills: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  fitness: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  entertainment: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  health: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  education: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  salary: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function AmountDisplay({ amount, type }: { amount: number; type: 'income' | 'expense' }) {
  const { isUnlocked } = usePinLock();
  if (!isUnlocked) {
    return <span className="font-mono font-semibold tracking-widest select-none">****</span>;
  }
  return (
    <span className={cn('font-semibold font-mono', type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
      {type === 'expense' ? '-' : '+'}${amount.toFixed(2)}
    </span>
  );
}

interface AddTxFormData {
  amount: string;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note: string;
}

export default function FinancePage() {
  const { user } = useAuth();
  const { isUnlocked } = usePinLock();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AddTxFormData>({
    amount: '',
    type: 'expense',
    category: 'food',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const currentMonth = new Date();
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    setTransactions(data || []);
    setLoading(false);
  };

  const monthTx = transactions.filter((t) => t.date >= monthStart && t.date <= monthEnd);
  const totalExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const handleAdd = async () => {
    if (!user || !form.amount || isNaN(parseFloat(form.amount))) return;
    setSaving(true);
    const { error } = await supabase.from('finance_transactions').insert({
      user_id: user.id,
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
      note: form.note || null,
      is_narrative: false,
      source: 'manual',
    });
    if (!error) {
      await loadTransactions();
      setAddOpen(false);
      setForm({ amount: '', type: 'expense', category: 'food', date: format(new Date(), 'yyyy-MM-dd'), note: '' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('finance_transactions').delete().eq('id', id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const grouped = transactions.reduce<Record<string, FinanceTransaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">财务管理</h1>
              <p className="text-sm text-muted-foreground">{format(currentMonth, 'yyyy年MM月', { locale: zhCN })}</p>
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            记一笔
          </Button>
        </div>

        <SensitiveWrapper label="财务数据受隐私保护">
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-2xl border-red-200/60 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-muted-foreground">本月支出</p>
                </div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 font-mono">
                  {isUnlocked ? `$${totalExpense.toFixed(2)}` : '****'}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">本月收入</p>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {isUnlocked ? `$${totalIncome.toFixed(2)}` : '****'}
                </p>
              </CardContent>
            </Card>
            <Card className={cn('rounded-2xl', netBalance >= 0 ? 'border-blue-200/60 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20' : 'border-orange-200/60 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-950/20')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={cn('w-4 h-4', netBalance >= 0 ? 'text-blue-500' : 'text-orange-500')} />
                  <p className="text-xs text-muted-foreground">净结余</p>
                </div>
                <p className={cn('text-xl font-bold font-mono', netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400')}>
                  {isUnlocked ? `${netBalance >= 0 ? '+' : ''}$${netBalance.toFixed(2)}` : '****'}
                </p>
              </CardContent>
            </Card>
          </div>
        </SensitiveWrapper>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              交易记录
              {!isUnlocked && (
                <Badge variant="secondary" className="ml-auto gap-1 text-xs">
                  <Lock className="w-3 h-3" />
                  金额已隐藏
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无交易记录</p>
                <p className="text-xs mt-1 opacity-70">点击"记一笔"开始记录</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {format(new Date(date + 'T00:00:00'), 'MM月dd日 EEEE', { locale: zhCN })}
                      </p>
                    </div>
                    {grouped[date].map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        <div className={cn('shrink-0 p-2 rounded-lg', tx.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30')}>
                          {tx.type === 'expense'
                            ? <ArrowDownCircle className="w-4 h-4 text-red-500" />
                            : <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {tx.note || CATEGORY_LABELS[tx.category] || tx.category}
                            </span>
                            <Badge className={cn('text-xs border-0 shrink-0', CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.default)}>
                              {CATEGORY_LABELS[tx.category] || tx.category}
                            </Badge>
                          </div>
                        </div>
                        <AmountDisplay amount={tx.amount} type={tx.type} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              记录交易
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-2">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setForm((f) => ({ ...f, type: t, category: t === 'income' ? 'salary' : 'food' }));
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    form.type === t
                      ? t === 'expense'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-emerald-500 text-white border-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-slate-300'
                  )}
                >
                  {t === 'expense' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                  {t === 'expense' ? '支出' : '收入'}
                </button>
              ))}
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">金额</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">分类</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">日期</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">备注（可选）</Label>
              <Input
                placeholder="例：午餐、超市购物…"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>

            <Button onClick={handleAdd} disabled={saving || !form.amount} className="w-full">
              {saving ? '保存中…' : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
