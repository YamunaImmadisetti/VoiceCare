import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useRef, useState } from 'react';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const SYSTEM_PROMPT = `You are CareVoice, a warm and caring voice assistant for elderly users.
You help with medication reminders, health questions, and daily tasks.
Keep responses SHORT (2-4 sentences max) and speak in plain, friendly language — no bullet points, no markdown.
Always address the user warmly. If they mention pain, dizziness, or an emergency, tell them to press the emergency button immediately.`;

export function useVoice(userContext?: string) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const transcriptRef = useRef('');

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    transcriptRef.current = text;
  });

  useSpeechRecognitionEvent('end', () => {
    if (transcriptRef.current.trim()) {
      askGemini(transcriptRef.current);
    } else {
      setState('idle');
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message ?? 'Speech recognition failed');
    setState('idle');
  });

  const askGemini = useCallback(async (text: string) => {
    setState('thinking');
    setResponse('');

    try {
      const contextPrefix = userContext
        ? `User health context: ${userContext}\n\nUser says: `
        : '';

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: contextPrefix + text }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7,
            },
          }),
        }
      );

      const data = await res.json();
      console.log('Gemini response:', JSON.stringify(data));
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Sorry, I didn't catch that. Could you try again?";

      setResponse(reply);
      speakResponse(reply);
    } catch (e) {
      console.log('Gemini error:', e);
      setError('Could not reach assistant. Check your connection.');
      setState('idle');
    }
  }, [userContext]);

  const speakResponse = (text: string) => {
    setState('speaking');
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => setState('idle'),
      onError: () => setState('idle'),
    });
  };

  const startListening = useCallback(async () => {
    setTranscript('');
    setResponse('');
    setError('');
    transcriptRef.current = '';

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('Microphone permission denied.');
      return;
    }

    setState('listening');
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }, []);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    Speech.stop();
    setState('idle');
  }, []);

  return { state, transcript, response, error, startListening, stopListening };
}