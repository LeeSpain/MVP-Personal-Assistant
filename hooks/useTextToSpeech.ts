import { useState, useEffect, useRef } from 'react';

export interface TextToSpeechHook {
    speak: (text: string, language?: string) => void;
    cancel: () => void;
    isSpeaking: boolean;
    hasSupport: boolean;
}

export const useTextToSpeech = (): TextToSpeechHook => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [hasSupport, setHasSupport] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
            setHasSupport(true);
        }
    }, []);

    const speak = (text: string, language: string = 'en-US') => {
        if (!synthRef.current) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;

        // Optional: Select a better voice if available (e.g., Google US English)
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes(language)) || voices.find(v => v.lang.includes(language)) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    const cancel = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return {
        speak,
        cancel,
        isSpeaking,
        hasSupport
    };
};
