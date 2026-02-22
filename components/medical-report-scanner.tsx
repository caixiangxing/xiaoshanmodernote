'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, CheckCircle2, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface ExtractedData {
  blood_glucose?: string;
  blood_pressure?: string;
  weight?: string;
  heart_rate?: string;
  cholesterol?: string;
  [key: string]: string | undefined;
}

export function MedicalReportScanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setExtractedData(null);
      setEditMode(false);
    }
  };

  const simulateAIProcessing = async () => {
    if (!file) return;

    setProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockData: ExtractedData = {
      blood_glucose: '5.2 mmol/L',
      blood_pressure: '120/80 mmHg',
      weight: '70.5 kg',
      heart_rate: '72 bpm',
      cholesterol: '4.8 mmol/L',
    };

    setExtractedData(mockData);
    setEditMode(true);
    setProcessing(false);
  };

  const handleDataChange = (key: string, value: string) => {
    setExtractedData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!user || !extractedData) return;

    setSaving(true);

    try {
      const { error } = await supabase.from('health_records').insert({
        user_id: user.id,
        record_type: 'lab_report',
        file_name: file?.name || 'Unknown',
        extracted_data: extractedData,
        verified: true,
        record_date: recordDate,
        notes,
      });

      if (error) throw error;

      const vitalData: any = {};
      if (extractedData.blood_glucose) {
        const match = extractedData.blood_glucose.match(/[\d.]+/);
        if (match) vitalData.blood_glucose = parseFloat(match[0]);
      }
      if (extractedData.blood_pressure) {
        const match = extractedData.blood_pressure.match(/(\d+)\/(\d+)/);
        if (match) {
          vitalData.blood_pressure_systolic = parseInt(match[1]);
          vitalData.blood_pressure_diastolic = parseInt(match[2]);
        }
      }
      if (extractedData.weight) {
        const match = extractedData.weight.match(/[\d.]+/);
        if (match) vitalData.weight = parseFloat(match[0]);
      }
      if (extractedData.heart_rate) {
        const match = extractedData.heart_rate.match(/\d+/);
        if (match) vitalData.heart_rate = parseInt(match[0]);
      }

      if (Object.keys(vitalData).length > 0) {
        await supabase.from('vital_signs').insert({
          user_id: user.id,
          recorded_at: recordDate,
          ...vitalData,
        });
      }

      toast({ title: '医疗报告已保存', description: '数据已成功录入系统' });

      setFile(null);
      setExtractedData(null);
      setEditMode(false);
      setNotes('');
    } catch (error: any) {
      toast({
        title: '保存失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          医疗报告扫描器
        </CardTitle>
        <CardDescription>上传检查报告，AI 将自动提取关键数据</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file && !extractedData && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                点击上传或拖拽文件
              </span>
              <p className="text-xs text-slate-500 mt-1">支持 JPG, PNG, PDF 格式</p>
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {file && !extractedData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <FileText className="w-8 h-8 text-purple-500" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>

            <Button onClick={simulateAIProcessing} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI 正在分析报告...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  开始 AI 识别
                </>
              )}
            </Button>
          </div>
        )}

        {extractedData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">AI 识别完成</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">提取的数据</Label>
                {!editMode ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                ) : null}
              </div>

              {Object.entries(extractedData).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-xs capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    value={value || ''}
                    onChange={(e) => handleDataChange(key, e.target.value)}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
              ))}

              <div>
                <Label className="text-xs">报告日期</Label>
                <Input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">备注</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="添加备注或补充说明..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中
                  </>
                ) : (
                  '确认保存'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setExtractedData(null);
                  setEditMode(false);
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
