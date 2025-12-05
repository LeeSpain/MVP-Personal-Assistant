import { useState, useEffect, useRef } from 'react';

export interface SpeechRecognitionHook {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    hasRecognitionSupport: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                setHasRecognitionSupport(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = false; // Stop after one sentence for simple chat
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    setIsListening(true);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        if (result.isFinal) {
                            currentTranscript += result[0].transcript;
                        } else {
                            currentTranscript += result[0].transcript;
                        }
                    }
                    setTranscript(currentTranscript);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                setTranscript('');
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start recognition", e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    const resetTranscript = () => {
        setTranscript('');
    };

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        hasRecognitionSupport
    };
};
