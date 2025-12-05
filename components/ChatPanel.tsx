import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setVoiceError('Speech recognition error.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop?.();
    };
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setVoiceError(null);
      recognition.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-full flex flex-col bg-white/90 border border-slate-200 shadow-lg shadow-slate-900/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
            Conversation
          </span>
          <span className="text-sm font-semibold text-slate-800">
            Your Digital Self
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 mr-1" />
          Live
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={[
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                  isUser
                    ? 'bg-slate-900 text-slate-50 rounded-br-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm',
                ].join(' ')}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <div className="mt-1.5 text-[10px] text-slate-400 flex justify-end">
                  {formatTime(m.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white/80 px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          {/* Mic */}
          <button
            type="button"
            onClick={toggleListening}
            className={[
              'inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors',
              isListening
                ? 'bg-red-50/60 border-red-300 text-red-600'
                : 'border-slate-300 text-slate-500 hover:bg-slate-50',
            ].join(' ')}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <span className="text-sm">🎤</span>
          </button>

          {/* Text input */}
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening...'
                  : 'Type or use the mic to talk to your Digital Self...'
              }
              className="w-full text-sm px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-slate-400"
            />
          </div>

          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-900 text-white shadow-md shadow-slate-900/30 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.928A2.25 2.25 0 0 0 5.86 9.61l3.142.524-.524 3.143a2.25 2.25 0 0 0 1.443 2.567l4.928 1.414a.75.75 0 0 0 .95-.826L13.31 3.268a1.75 1.75 0 0 0-2.122-2.122L3.105 2.29Z" />
            </svg>
          </button>
        </form>

        {voiceError && (
          <p className="mt-1 text-[11px] text-red-500">{voiceError}</p>
        )}
      </div>
    </div>
  );
};
