'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';

type MetricType = 'weight' | 'blood_pressure' | 'heart_rate' | 'blood_glucose' | 'steps';

interface ChartDataPoint {
  date: string;
  value?: number;
  systolic?: number;
  diastolic?: number;
}

export function HealthTrendsChart() {
  const { user } = useAuth();
  const [metric, setMetric] = useState<MetricType>('weight');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChartData();
    }
  }, [user, metric]);

  const loadChartData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      if (metric === 'steps') {
        const { data, error } = await supabase
          .from('fitness_data')
          .select('date, steps')
          .eq('user_id', user.id)
          .order('date', { ascending: true })
          .limit(30);

        if (error) throw error;

        const formattedData = (data || []).map((item) => ({
          date: format(new Date(item.date), 'MM/dd'),
          value: item.steps,
        }));

        setChartData(formattedData);
      } else {
        const { data, error } = await supabase
          .from('vital_signs')
          .select('recorded_at, weight, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, blood_glucose')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: true })
          .limit(30);

        if (error) throw error;

        const formattedData = (data || [])
          .filter((item) => {
            switch (metric) {
              case 'weight':
                return item.weight != null;
              case 'blood_pressure':
                return item.blood_pressure_systolic != null && item.blood_pressure_diastolic != null;
              case 'heart_rate':
                return item.heart_rate != null;
              case 'blood_glucose':
                return item.blood_glucose != null;
              default:
                return false;
            }
          })
          .map((item) => {
            const baseData = {
              date: format(new Date(item.recorded_at), 'MM/dd'),
            };

            switch (metric) {
              case 'weight':
                return { ...baseData, value: Number(item.weight) };
              case 'blood_pressure':
                return {
                  ...baseData,
                  systolic: item.blood_pressure_systolic,
                  diastolic: item.blood_pressure_diastolic,
                };
              case 'heart_rate':
                return { ...baseData, value: item.heart_rate };
              case 'blood_glucose':
                return { ...baseData, value: Number(item.blood_glucose) };
              default:
                return baseData;
            }
          });

        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = (type: MetricType) => {
    switch (type) {
      case 'weight':
        return '体重 (kg)';
      case 'blood_pressure':
        return '血压 (mmHg)';
      case 'heart_rate':
        return '心率 (bpm)';
      case 'blood_glucose':
        return '血糖 (mmol/L)';
      case 'steps':
        return '步数';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              健康趋势
            </CardTitle>
            <CardDescription>追踪关键健康指标的变化</CardDescription>
          </div>
          <Select value={metric} onValueChange={(value) => setMetric(value as MetricType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">体重</SelectItem>
              <SelectItem value="blood_pressure">血压</SelectItem>
              <SelectItem value="heart_rate">心率</SelectItem>
              <SelectItem value="blood_glucose">血糖</SelectItem>
              <SelectItem value="steps">步数</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-slate-500">暂无数据</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                className="text-xs"
                stroke="currentColor"
              />
              <YAxis
                className="text-xs"
                stroke="currentColor"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              {metric === 'blood_pressure' ? (
                <>
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="收缩压"
                    dot={{ fill: '#ef4444', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="舒张压"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name={getMetricLabel(metric)}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
