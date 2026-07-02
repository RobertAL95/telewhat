'use client';

import { useState, useRef, useEffect } from 'react';
import { startAudioRecording, stopAudioRecording, cancelAudioRecording } from '@/utils/audio';

export function useChatAudio(onSend: (file: File) => Promise<void>) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      await startAudioRecording();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch (err) {
      console.error("❌ Fallo al iniciar hardware de audio:", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    cancelAudioRecording();
    setIsRecording(false);
    setRecordingTime(0);
  };

  const stopRecordingAndSend = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    try {
      const audioFile = await stopAudioRecording();
      setIsRecording(false);
      setRecordingTime(0);
      await onSend(audioFile);
    } catch (err) {
      console.error("❌ Error deteniendo captura de audio:", err);
      setIsRecording(false);
    }
  };

  return { isRecording, recordingTime, startRecording, cancelRecording, stopRecordingAndSend };
}