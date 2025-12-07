import { useState, useEffect, useRef } from 'react';
import AudioVisualizer from './AudioVisualizer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceModeProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (text: string) => Promise<void>;
    messages: ChatMessage[];
    isProcessing: boolean;
}

export default function VoiceMode({ isOpen, onClose, onSendMessage, messages, isProcessing }: VoiceModeProps) {
    const { t, language } = useLanguage();
    const { isListening, transcript, startListening, stopListening } = useSpeechRecognition(language === 'nl' ? 'nl-NL' : 'en-US');
    const { speak, isSpeaking } = useTextToSpeech();

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

    const lastMessageIdRef = useRef<string | null>(null);

    // 1. Sync status with hooks
    useEffect(() => {
        if (isSpeaking) {
            setStatus('speaking');
        } else if (isListening) {
            setStatus('listening');
        } else if (status === 'speaking' || status === 'listening') {
            setStatus('idle');
        }
    }, [isListening, isSpeaking]);

    // 2. Handle Microphone Stream for Visualizer
    useEffect(() => {
        if (isOpen && !stream) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(s => setStream(s))
                .catch(e => console.error("Mic access denied", e));
        } else if (!isOpen && stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [isOpen]);

    // 3. Auto-start listening when open (or after speaking)
    useEffect(() => {
        if (isOpen && !isProcessing && status === 'idle' && !isListening && !isSpeaking) {
            startListening();
        }
    }, [isOpen, isProcessing, status, isListening, isSpeaking]);

    // 4. Handle Sending Message
    useEffect(() => {
        if (!isListening && transcript && status !== 'thinking' && status !== 'speaking') {
            // Recognition ended and we have text
            setStatus('thinking');
            onSendMessage(transcript);
        }
    }, [isListening, transcript]);

    // 5. Handle AI Speaking (TTS)
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id !== lastMessageIdRef.current) {
            lastMessageIdRef.current = lastMsg.id;
            speak(lastMsg.content, language === 'nl' ? 'nl-NL' : 'en-US');
        }
    }, [messages]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-6">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Status Text */}
            <div className="mb-12 text-center space-y-2">
                <h2 className="text-2xl font-light text-slate-100 tracking-wider uppercase">
                    {t(`voice.${status}` as any)}
                </h2>
                {transcript && (
                    <p className="text-slate-400 text-lg italic max-w-md mx-auto">
                        "{transcript}"
                    </p>
                )}
            </div>

            {/* Visualizer */}
            <div className="w-64 h-64 relative flex items-center justify-center">
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-violet-500 rounded-full blur-3xl opacity-20 transition-opacity duration-500 ${status === 'speaking' ? 'opacity-40' : ''}`}></div>

                <AudioVisualizer
                    stream={stream}
                    isActive={true}
                    color={status === 'speaking' ? '#34d399' : '#8b5cf6'} // Green for AI, Violet for User
                />
            </div>

            {/* Controls */}
            <div className="mt-16 flex gap-6">
                <button
                    onClick={() => {
                        if (isListening) stopListening();
                        else startListening();
                    }}
                    className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    {isListening ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
