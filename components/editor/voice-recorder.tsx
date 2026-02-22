'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (base64Audio: string) => void;
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setProcessing(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          onRecordingComplete(base64);
          setProcessing(false);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (processing) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>处理录音...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <>
          <div className="flex items-center gap-2 text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono">{formatTime(seconds)}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={stopRecording}
          >
            <Square className="w-4 h-4 mr-1 fill-current" />
            停止录音
          </Button>
        </>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={startRecording}>
          <Mic className="w-4 h-4 mr-1" />
          录制语音
        </Button>
      )}
    </div>
  );
}
