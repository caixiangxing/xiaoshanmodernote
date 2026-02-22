export type LifeGoals = {
  writing_target: number;
  steps_target: number;
  workout_target: number;
  weight_target: number;
  bp_systolic_target: number;
  glucose_target: number;
  mood_target: number;
  daily_budget: number;
};

export const DEFAULT_GOALS: LifeGoals = {
  writing_target: 2000,
  steps_target: 10000,
  workout_target: 60,
  weight_target: 70,
  bp_systolic_target: 120,
  glucose_target: 5.5,
  mood_target: 8,
  daily_budget: 50,
};

export const GOAL_META: {
  key: keyof LifeGoals;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}[] = [
  {
    key: 'writing_target',
    label: '每日写作目标',
    unit: '字',
    min: 100,
    max: 10000,
    step: 100,
    description: '每天写多少字算达标',
  },
  {
    key: 'steps_target',
    label: '每日步数目标',
    unit: '步',
    min: 1000,
    max: 30000,
    step: 500,
    description: '每天走多少步算达标',
  },
  {
    key: 'workout_target',
    label: '每日锻炼目标',
    unit: '分钟',
    min: 10,
    max: 180,
    step: 5,
    description: '每天锻炼多少分钟算达标',
  },
  {
    key: 'weight_target',
    label: '目标体重',
    unit: 'kg',
    min: 40,
    max: 150,
    step: 0.5,
    description: '稳定在目标体重附近得满分',
  },
  {
    key: 'bp_systolic_target',
    label: '目标收缩压',
    unit: 'mmHg',
    min: 90,
    max: 160,
    step: 1,
    description: '越接近目标值得分越高',
  },
  {
    key: 'glucose_target',
    label: '目标血糖',
    unit: 'mmol/L',
    min: 3.5,
    max: 10,
    step: 0.1,
    description: '越接近目标值得分越高',
  },
  {
    key: 'mood_target',
    label: '心情目标分',
    unit: '分',
    min: 5,
    max: 10,
    step: 1,
    description: '心情评分目标（1-10）',
  },
  {
    key: 'daily_budget',
    label: '每日消费预算',
    unit: '元',
    min: 10,
    max: 1000,
    step: 10,
    description: '超出预算时财务指数降低',
  },
];
