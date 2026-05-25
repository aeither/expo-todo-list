import * as Speech from 'expo-speech';
import { useCallback, useRef, useState } from 'react';

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);

  const safeSetSpeaking = useCallback((val: boolean) => {
    if (mounted.current) setSpeaking(val);
  }, []);

  const speak = useCallback((text: string) => {
    Speech.stop();
    safeSetSpeaking(true);
    Speech.speak(text, {
      language: 'zh-CN',
      rate: 0.75,
      onDone: () => safeSetSpeaking(false),
      onStopped: () => safeSetSpeaking(false),
      onError: () => safeSetSpeaking(false),
    });
  }, [safeSetSpeaking]);

  const stop = useCallback(() => {
    Speech.stop();
    safeSetSpeaking(false);
  }, [safeSetSpeaking]);

  return { speak, stop, speaking };
}
