'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import { supabase, HealthRecord } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { SensitiveWrapper } from './sensitive-wrapper';
import { MedicalReportScanner } from '@/components/medical-report-scanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format } from 'date-fns';

export function MedicalRecordsWidget() {
  const { user } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const loadRecords = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', user.id)
      .order('record_date', { ascending: false })
      .limit(5);
    if (data) setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadRecords();
  }, [user]);

  const typeLabel: Record<string, string> = {
    blood_test: '血液检测',
    urine_test: '尿液检测',
    imaging: '影像报告',
    ecg: '心电图',
    other: '其他',
  };

  return (
    <>
      <Card className="h-full bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200/60 dark:border-rose-800/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <FileText className="w-5 h-5" />
              医疗档案
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-600" onClick={() => setScanOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SensitiveWrapper label="医疗档案受隐私保护">
            <div className="space-y-2">
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500" />
                </div>
              )}
              {!loading && records.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">暂无医疗记录</p>
                  <Button size="sm" variant="outline" onClick={() => setScanOpen(true)}>
                    上传首份报告
                  </Button>
                </div>
              )}
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 p-2.5 bg-white/60 dark:bg-slate-800/40 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                    <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {rec.file_name || typeLabel[rec.record_type] || rec.record_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rec.record_date), 'yyyy-MM-dd')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 shrink-0">
                    {typeLabel[rec.record_type] || rec.record_type}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {records.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-1">显示最近 5 条记录</p>
              )}
            </div>
          </SensitiveWrapper>
        </CardContent>
      </Card>

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <MedicalReportScanner />
        </DialogContent>
      </Dialog>
    </>
  );
}
