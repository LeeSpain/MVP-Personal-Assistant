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

export default function VoiceMode({
    isOpen,
    onClose,
    onSendMessage,
    messages,
    isProcessing,
}: VoiceModeProps) {
    const { t, language } = useLanguage();
    const {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
    } = useSpeechRecognition(language === 'nl' ? 'nl-NL' : 'en-US');
    const { speak, isSpeaking } = useTextToSpeech();

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] =
        useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [view, setView] = useState<'visualizer' | 'chat'>('visualizer');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    // -------- CLOSE HANDLER (IMPORTANT) ----------
    const handleClose = () => {
        console.log('VoiceMode: handleClose');

        // Stop speech recognition
        if (isListening) {
            stopListening();
        }
        resetTranscript();

        // Stop microphone stream
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }

        // Reset UI state
        setIsMuted(false);
        setView('visualizer');
        setStatus('idle');

        // Tell parent to hide overlay
        onClose();
    };

    // 1. Sync status with hooks
    useEffect(() => {
        if (isSpeaking) {
            setStatus('speaking');
        } else if (isListening) {
            setStatus('listening');
        } else if (status === 'speaking' || status === 'listening') {
            setStatus('idle');
        }
    }, [isListening, isSpeaking, status]);

    // 2. Handle Microphone Stream for Visualizer
    useEffect(() => {
        if (isOpen && !stream) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((s) => setStream(s))
                .catch((e) => console.error('Mic access denied', e));
        } else if (!isOpen && stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
            setIsMuted(false); // Reset mute state on close
            setView('visualizer'); // Reset view on close
        }
    }, [isOpen, stream]);

    // 3. Auto-start listening when open (or after speaking)
    useEffect(() => {
        if (
            isOpen &&
            !isProcessing &&
            status === 'idle' &&
            !isListening &&
            !isSpeaking &&
            !isMuted
        ) {
            startListening();
        }
    }, [
        isOpen,
        isProcessing,
        status,
        isListening,
        isSpeaking,
        startListening,
        isMuted,
    ]);

    // 4. Handle Sending Message
    useEffect(() => {
        if (
            !isListening &&
            transcript &&
            status !== 'thinking' &&
            status !== 'speaking' &&
            !isMuted
        ) {
            // Recognition ended and we have text
            setStatus('thinking');
            onSendMessage(transcript);
            resetTranscript();
        }
    }, [isListening, transcript, status, onSendMessage, resetTranscript, isMuted]);

    // 5. Handle AI Speaking (TTS)
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (
            lastMsg &&
            lastMsg.role === 'assistant' &&
            lastMsg.id !== lastMessageIdRef.current
        ) {
            lastMessageIdRef.current = lastMsg.id;
            speak(lastMsg.content, language === 'nl' ? 'nl-NL' : 'en-US');
        }
    }, [messages, language, speak]);

    // Scroll to bottom of chat
    useEffect(() => {
        if (view === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view]);

    const toggleMute = () => {
        console.log('Toggle mute clicked');
        // Always toggle UI state so you SEE it change
        setIsMuted((prev) => !prev);

        // If we have a real audio track, also toggle that
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const nowMuted = !audioTrack.enabled;
                console.log('Microphone track toggled. Muted:', nowMuted);

                // If we are muting, stop listening to avoid partial transcripts
                if (nowMuted) {
                    if (isListening) stopListening();
                } else {
                    if (!isListening && !isSpeaking) startListening();
                }
            }
        } else {
            console.warn('No stream to mute (UI still toggled)');
        }
    };

    const handleListeningToggle = () => {
        console.log('Listening toggle clicked');
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-6">
            {/* Close Button (top-right X) */}
            <button
                onClick={handleClose}
                className="absolute top-6 right-6 text-slate-400 hover:text-white z-[110] p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            {/* View Toggle */}
            <div className="absolute top-6 left-6 z-[110]">
                <button
                    onClick={() => {
                        console.log('View toggle clicked. Current:', view);
                        setView(view === 'visualizer' ? 'chat' : 'visualizer');
                    }}
                    className="bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-colors border border-slate-700 shadow-lg"
                >
                    {view === 'visualizer' ? 'Show Chat' : 'Show Visualizer'}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center relative z-[105]">
                {view === 'visualizer' ? (
                    <>
                        {/* Status Text */}
                        <div className="mb-12 text-center space-y-2">
                            <h2 className="text-2xl font-light text-slate-100 tracking-wider uppercase">
                                {isMuted ? 'MUTED' : t(`voice.${status}` as any)}
                            </h2>
                            {transcript && !isMuted && (
                                <p className="text-slate-400 text-lg italic max-w-md mx-auto">
                                    &quot;{transcript}&quot;
                                </p>
                            )}
                        </div>

                        {/* Visualizer */}
                        <div className="w-64 h-64 relative flex items-center justify-center">
                            {/* Glow Effect */}
                            <div
                                className={`absolute inset-0 bg-violet-500 rounded-full blur-3xl opacity-20 transition-opacity duration-500 ${status === 'speaking' ? 'opacity-40' : ''
                                    }`}
                            ></div>

                            <AudioVisualizer
                                stream={stream}
                                isActive={!isMuted}
                                color={status === 'speaking' ? '#34d399' : '#8b5cf6'} // Green for AI, Violet for User
                            />
                        </div>
                    </>
                ) : (
                    /* Chat View */
                    <div className="w-full h-[60vh] bg-slate-900/50 rounded-2xl border border-slate-800 p-4 overflow-y-auto custom-scrollbar relative z-[110]">
                        <div className="space-y-4">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user'
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-slate-800 text-slate-100'
                                            }`}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {transcript && !isMuted && (
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-violet-600/50 text-white/70 italic">
                                        {transcript}...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* Big Back-to-messaging button */}
            <button
                onClick={handleClose}
                className="mt-4 mb-4 px-6 py-3 rounded-full bg-slate-800 text-slate-100 hover:bg-slate-700 text-sm font-semibold tracking-wide z-[110]"
            >
                ← Back to messaging
            </button>

            {/* Controls */}
            <div className="mt-2 flex gap-6 z-[110]">
                {/* Mute Button */}
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all shadow-lg ${isMuted
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.69 0-1.25-.56-1.25-1.25v-6.75c0-.69.56-1.25 1.25-1.25h2.25z"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H6.375c-.621 0-1.125-.504-1.125-1.125v-9.375c0-.621.504-1.125 1.125-1.125h3.375z"
                            />
                        </svg>
                    )}
                </button>

                {/* Listening Toggle */}
                <button
                    onClick={handleListeningToggle}
                    className={`p-4 rounded-full transition-all shadow-lg ${isListening
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    {isListening ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
