'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AvatarState, avatarAssets, therapeuticResponseMap, playAmbientTrack, musicTriggers } from './avatar-config';
import { useMood } from './mood-context';

interface AvatarContextType {
  currentState: AvatarState;
  showMessage: boolean;
  message: string;
  imageUrl: string;
  animation: string;
  triggerResponse: (moodScore?: number | null, keywords?: string[]) => void;
  setThinking: () => void;
  setListening: () => void;
  clearMessage: () => void;
  analyzeAndRespond: (content: string, moodScore?: number | null) => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { latestMoodScore } = useMood();
  const [currentState, setCurrentState] = useState<AvatarState>('idle');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (latestMoodScore !== null && currentState === 'idle') {
      const newState = therapeuticResponseMap(latestMoodScore);
      if (newState !== 'idle') {
        setCurrentState(newState);
        setShowMessage(true);
        playAmbientTrack(musicTriggers[newState]);

        const config = avatarAssets[newState];
        setTimeout(() => {
          setShowMessage(false);
          setTimeout(() => setCurrentState('idle'), 500);
        }, config.duration);
      }
    }
  }, [latestMoodScore]);

  const triggerResponse = useCallback((moodScore?: number | null, keywords?: string[]) => {
    const score = moodScore ?? latestMoodScore;
    const newState = therapeuticResponseMap(score, keywords);

    setCurrentState(newState);
    setShowMessage(true);
    playAmbientTrack(musicTriggers[newState]);

    const config = avatarAssets[newState];
    setTimeout(() => {
      setShowMessage(false);
      setTimeout(() => setCurrentState('idle'), 500);
    }, config.duration);
  }, [latestMoodScore]);

  const setThinking = useCallback(() => {
    setCurrentState('thinking');
    setShowMessage(true);
  }, []);

  const setListening = useCallback(() => {
    setCurrentState('listening');
    setShowMessage(true);
  }, []);

  const clearMessage = useCallback(() => {
    setShowMessage(false);
    setTimeout(() => setCurrentState('idle'), 300);
  }, []);

  const analyzeAndRespond = useCallback(async (content: string, moodScore?: number | null) => {
    setThinking();

    await new Promise(resolve => setTimeout(resolve, 2000));

    const keywords = content.toLowerCase().split(/\s+/);

    const anxietyKeywords = ['焦虑', '紧张', '担心', '害怕', '不安', 'anxious', 'worried', 'nervous', 'scared'];
    const sadKeywords = ['难过', '伤心', '痛苦', '沮丧', 'sad', 'depressed', 'hurt'];
    const happyKeywords = ['开心', '高兴', '快乐', '兴奋', 'happy', 'excited', 'joyful'];

    const hasAnxiety = keywords.some(word => anxietyKeywords.some(kw => word.includes(kw)));
    const hasSadness = keywords.some(word => sadKeywords.some(kw => word.includes(kw)));
    const hasHappiness = keywords.some(word => happyKeywords.some(kw => word.includes(kw)));

    let detectedKeywords: string[] = [];
    if (hasAnxiety) detectedKeywords.push('焦虑');
    if (hasSadness) detectedKeywords.push('难过');
    if (hasHappiness) detectedKeywords.push('开心');

    triggerResponse(moodScore, detectedKeywords);
  }, [triggerResponse, setThinking]);

  const config = avatarAssets[currentState];

  return (
    <AvatarContext.Provider
      value={{
        currentState,
        showMessage,
        message: config.message,
        imageUrl: config.imageUrl,
        animation: config.animation,
        triggerResponse,
        setThinking,
        setListening,
        clearMessage,
        analyzeAndRespond,
      }}
    >
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
}
