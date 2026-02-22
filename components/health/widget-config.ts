import type { ElementType } from 'react';
import { Footprints, Scale, FileText, Pill, Sparkles } from 'lucide-react';

export type WidgetId = 'fitness' | 'body' | 'medical' | 'medication' | 'healthIndex';

export const WIDGET_CONFIGS: {
  id: WidgetId;
  label: string;
  description: string;
  icon: ElementType;
  bgColor: string;
  iconColor: string;
  sensitive: boolean;
}[] = [
  {
    id: 'fitness',
    label: '健身追踪',
    description: '步数、卡路里、运动活动环',
    icon: Footprints,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    sensitive: false,
  },
  {
    id: 'body',
    label: '体型管理',
    description: '体重、BMI、体脂率',
    icon: Scale,
    bgColor: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    sensitive: false,
  },
  {
    id: 'medical',
    label: '医疗档案',
    description: '检验报告、影像资料（敏感）',
    icon: FileText,
    bgColor: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    sensitive: true,
  },
  {
    id: 'medication',
    label: '用药管理',
    description: '药品计划、库存提醒（敏感）',
    icon: Pill,
    bgColor: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    sensitive: true,
  },
  {
    id: 'healthIndex',
    label: '健康指数',
    description: 'AI 综合健康评分',
    icon: Sparkles,
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    sensitive: false,
  },
];

export const DEFAULT_VISIBLE: Record<WidgetId, boolean> = {
  fitness: true,
  body: true,
  medical: true,
  medication: true,
  healthIndex: true,
};
