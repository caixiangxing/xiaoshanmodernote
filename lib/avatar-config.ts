export type AvatarState =
  | 'idle'
  | 'comforting'
  | 'calming'
  | 'celebrating'
  | 'encouraging'
  | 'listening'
  | 'thinking';

export interface AvatarConfig {
  state: AvatarState;
  imageUrl: string;
  message: string;
  animation: 'float' | 'bounce' | 'pulse' | 'gentle' | 'still';
  duration: number;
}

export const avatarAssets: Record<AvatarState, AvatarConfig> = {
  idle: {
    state: 'idle',
    imageUrl: 'https://images.pexels.com/photos/1906153/pexels-photo-1906153.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    message: '我在这里陪着你',
    animation: 'float',
    duration: 3000,
  },
  comforting: {
    state: 'comforting',
    imageUrl: 'https://images.pexels.com/photos/1906157/pexels-photo-1906157.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    message: '我会一直陪在你身边。慢慢来，不着急',
    animation: 'gentle',
    duration: 5000,
  },
  calming: {
    state: 'calming',
    imageUrl: 'https://images.pexels.com/photos/1906158/pexels-photo-1906158.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    message: '让我们一起深呼吸。吸气...呼气...',
    animation: 'pulse',
    duration: 6000,
  },
  celebrating: {
    state: 'celebrating',
    imageUrl: 'https://images.pexels.com/photos/1906154/pexels-photo-1906154.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    message: '你的能量太棒了！让我们记录下这美好时刻',
    animation: 'bounce',
    duration: 4000,
  },
  encouraging: {
    state: 'encouraging',
    imageUrl: 'https://images.pexels.com/photos/1906156/pexels-photo-1906156.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    message: '每一步都是进步。你做得很好',
    animation: 'float',
    duration: 4000,
  },
  listening: {
    state: 'listening',
    imageUrl: 'https://images.pexels.com/photos/1906155/pexels-photo-1906155.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    message: '我在认真倾听你的心声',
    animation: 'gentle',
    duration: 3000,
  },
  thinking: {
    state: 'thinking',
    imageUrl: 'https://images.pexels.com/photos/1906159/pexels-photo-1906159.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    message: '让我想想如何帮助你...',
    animation: 'pulse',
    duration: 2000,
  },
};

export const therapeuticResponseMap = (moodScore: number | null, keywords?: string[]): AvatarState => {
  if (moodScore === null) {
    return 'idle';
  }

  const anxietyKeywords = ['焦虑', '紧张', '担心', '害怕', '不安', 'anxious', 'worried', 'nervous', 'scared'];
  const hasAnxiety = keywords?.some(keyword =>
    anxietyKeywords.some(anxWord => keyword.toLowerCase().includes(anxWord.toLowerCase()))
  );

  if (hasAnxiety) {
    return 'calming';
  }

  if (moodScore <= 2) {
    return 'comforting';
  }

  if (moodScore <= 4) {
    return 'encouraging';
  }

  if (moodScore >= 8) {
    return 'celebrating';
  }

  return 'idle';
};

export const musicTriggers: Record<AvatarState, string> = {
  idle: 'ambient_neutral',
  comforting: 'ambient_calm',
  calming: 'breathing_guide',
  celebrating: 'uplifting_energy',
  encouraging: 'gentle_motivation',
  listening: 'soft_background',
  thinking: 'processing',
};

export function playAmbientTrack(track: string): void {
  console.log(`[Future Feature] Playing ambient track: ${track}`);
}
