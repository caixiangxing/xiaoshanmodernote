'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const CORRECT_PIN = '1234';
const SESSION_DURATION_MS = 5 * 60 * 1000;

interface PinLockContextValue {
  isUnlocked: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
  unlockedAt: number | null;
}

const PinLockContext = createContext<PinLockContextValue>({
  isUnlocked: false,
  unlock: () => false,
  lock: () => {},
  unlockedAt: null,
});

export function PinLockProvider({ children }: { children: ReactNode }) {
  const [unlockedAt, setUnlockedAt] = useState<number | null>(null);

  const isUnlocked = unlockedAt !== null && Date.now() - unlockedAt < SESSION_DURATION_MS;

  const unlock = useCallback((pin: string) => {
    if (pin === CORRECT_PIN) {
      setUnlockedAt(Date.now());
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    setUnlockedAt(null);
  }, []);

  return (
    <PinLockContext.Provider value={{ isUnlocked, unlock, lock, unlockedAt }}>
      {children}
    </PinLockContext.Provider>
  );
}

export function usePinLock() {
  return useContext(PinLockContext);
}
