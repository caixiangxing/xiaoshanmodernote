import { LifeGoals } from './life-goals';

export type IndexType = 'POSITIVE' | 'STABILITY' | 'MOOD';

export function calculateIndex(type: IndexType, actual: number, target: number): number {
  if (type === 'POSITIVE') {
    return Math.min(100, Math.round((actual / target) * 100));
  }
  if (type === 'STABILITY') {
    const deviation = Math.abs(actual - target) / target;
    return Math.max(0, Math.round((1 - deviation) * 100));
  }
  if (type === 'MOOD') {
    return Math.min(100, Math.round((actual / 10) * 100));
  }
  return 0;
}

export function moodToIndex(score: number, goals: LifeGoals): number {
  return calculateIndex('MOOD', score, goals.mood_target);
}

export function wordsToCreationIndex(words: number, goals: LifeGoals): number {
  return calculateIndex('POSITIVE', words, goals.writing_target);
}

export function notesToLearningIndex(noteCount: number, wordCount: number, goals: LifeGoals): number {
  const noteComponent = Math.min(40, calculateIndex('POSITIVE', noteCount, 5) * 0.4);
  const wordComponent = calculateIndex('POSITIVE', wordCount, goals.writing_target) * 0.6;
  return Math.min(100, Math.round(noteComponent + wordComponent));
}

export function fitnessToHealthIndex(
  steps: number,
  workoutMinutes: number,
  goals: LifeGoals
): number {
  const stepsScore = calculateIndex('POSITIVE', steps, goals.steps_target);
  const workoutScore = calculateIndex('POSITIVE', workoutMinutes, goals.workout_target);
  return Math.min(100, Math.round(stepsScore * 0.6 + workoutScore * 0.4));
}

export function vitalSignsToHealthIndex(
  weight: number | null,
  bpSystolic: number | null,
  glucose: number | null,
  goals: LifeGoals
): number {
  const scores: number[] = [];
  if (weight != null) scores.push(calculateIndex('STABILITY', weight, goals.weight_target));
  if (bpSystolic != null) scores.push(calculateIndex('STABILITY', bpSystolic, goals.bp_systolic_target));
  if (glucose != null) scores.push(calculateIndex('STABILITY', glucose, goals.glucose_target));
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function spendingToFinanceIndex(dailySpend: number, dailyBudget: number): number {
  if (dailySpend === 0) return 100;
  const ratio = dailySpend / dailyBudget;
  return Math.max(0, Math.round((1 - Math.min(ratio - 1, 1)) * 100));
}

export type DayData = {
  date: string;
  dateLabel: string;
  moodIndex: number | null;
  creationIndex: number | null;
  learningIndex: number | null;
  healthIndex: number | null;
  financeIndex: number | null;
  rawMood: number | null;
  rawWords: number | null;
  rawSteps: number | null;
  rawWorkout: number | null;
  rawSpend: number | null;
  notes: { id: string; title: string; type: 'note' | 'mood' | 'health' }[];
};
