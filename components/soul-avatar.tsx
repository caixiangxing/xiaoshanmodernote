'use client';

import { useState, useEffect } from 'react';
import { useAvatar } from '@/lib/avatar-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SpeechBubble } from './speech-bubble';
import Image from 'next/image';

interface SoulAvatarProps {
  onAvatarClick: () => void;
}

export function SoulAvatar({ onAvatarClick }: SoulAvatarProps) {
  const { currentState, showMessage, message, imageUrl, animation } = useAvatar();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => setImageLoaded(true);
  }, [imageUrl]);

  const getAnimationClass = () => {
    switch (animation) {
      case 'bounce':
        return 'avatar-bounce';
      case 'pulse':
        return 'avatar-pulse';
      case 'gentle':
        return 'avatar-gentle';
      case 'still':
        return 'avatar-still';
      default:
        return 'avatar-float';
    }
  };

  const getStateText = () => {
    switch (currentState) {
      case 'comforting':
        return '正在安慰你';
      case 'calming':
        return '帮你放松';
      case 'celebrating':
        return '为你庆祝';
      case 'encouraging':
        return '鼓励你';
      case 'listening':
        return '在倾听';
      case 'thinking':
        return '思考中';
      default:
        return '陪伴着你';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onAvatarClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${
              isHovered ? 'scale-110' : 'scale-100'
            } cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 rounded-full`}
            aria-label="情绪守护者"
          >
            <div className="relative">
              <SpeechBubble message={message} visible={showMessage} />

              <div className={`avatar-container ${getAnimationClass()}`}>
                <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-2xl border-4 border-white/30 backdrop-blur-sm">
                  {imageLoaded ? (
                    <Image
                      src={imageUrl}
                      alt="Emotional Guardian"
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 animate-pulse" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>

                  {isHovered && (
                    <div className="absolute inset-0 border-4 border-white/50 rounded-full animate-ping"></div>
                  )}
                </div>

                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              </div>
            </div>

            <style jsx>{`
              .avatar-container {
                position: relative;
                animation-duration: 3s;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }

              .avatar-float {
                animation-name: float-motion;
              }

              .avatar-bounce {
                animation-name: bounce-motion;
                animation-duration: 2s;
              }

              .avatar-pulse {
                animation-name: pulse-motion;
                animation-duration: 4s;
              }

              .avatar-gentle {
                animation-name: gentle-motion;
                animation-duration: 4s;
              }

              .avatar-still {
                animation: none;
              }

              @keyframes float-motion {
                0%,
                100% {
                  transform: translateY(0px) rotate(0deg);
                }
                50% {
                  transform: translateY(-12px) rotate(2deg);
                }
              }

              @keyframes bounce-motion {
                0%,
                100% {
                  transform: translateY(0px) scale(1);
                }
                25% {
                  transform: translateY(-18px) scale(1.08);
                }
                50% {
                  transform: translateY(0px) scale(1);
                }
                75% {
                  transform: translateY(-18px) scale(1.08);
                }
              }

              @keyframes pulse-motion {
                0%,
                100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.05);
                }
              }

              @keyframes gentle-motion {
                0%,
                100% {
                  transform: translateY(0px) scale(1);
                }
                50% {
                  transform: translateY(-6px) scale(1.02);
                }
              }

              @keyframes ping {
                75%,
                100% {
                  transform: scale(1.5);
                  opacity: 0;
                }
              }

              .animate-ping {
                animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
              }
            `}</style>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
          <p className="font-medium">情绪守护者</p>
          <p className="text-xs opacity-90">{getStateText()}</p>
          <p className="text-xs opacity-75 mt-1">点击记录心情</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
