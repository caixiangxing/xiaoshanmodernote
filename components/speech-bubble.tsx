'use client';

import { useEffect, useState } from 'react';

interface SpeechBubbleProps {
  message: string;
  visible: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function SpeechBubble({ message, visible, duration = 4000, onComplete }: SpeechBubbleProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) {
          setTimeout(onComplete, 300);
        }
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration, onComplete, message]);

  return (
    <div
      className={`absolute bottom-full right-0 mb-4 transition-all duration-300 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="relative bg-gradient-to-br from-purple-500/95 to-pink-500/95 backdrop-blur-sm text-white px-4 py-3 rounded-2xl shadow-2xl max-w-xs min-w-[200px]">
        <p className="text-sm leading-relaxed font-medium text-center">{message}</p>

        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-pink-500/95 transform rotate-45"></div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
      </div>

      <style jsx>{`
        @keyframes bubble-in {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          50% {
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .opacity-100 {
          animation: bubble-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
