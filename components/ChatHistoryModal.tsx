import { useState } from "react";
import Modal from "./Modal";
import { ChatSession } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { nl, enUS } from 'date-fns/locale';
import { format } from 'date-fns';

interface ChatHistoryModalProps {
    history: ChatSession[];
    onClose: () => void;
    onDeleteSession: (id: string) => void;
}

export default function ChatHistoryModal({ history, onClose, onDeleteSession }: ChatHistoryModalProps) {
    const { t, language } = useLanguage();
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const locale = language === 'nl' ? nl : enUS;

    return (
        <Modal open={true} title={t('chat.history')} onClose={onClose}>
            <div className="flex h-[60vh] gap-4">
                {/* Sidebar: List of Sessions */}
                <div className="w-1/3 border-r border-slate-800 pr-2 overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center mt-10">{t('chat.noHistory')}</div>
                    ) : (
                        <div className="space-y-2">
                            {history.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => setSelectedSession(session)}
                                    className={`w-full text-left p-3 rounded-lg text-xs transition-colors ${selectedSession?.id === session.id
                                        ? "bg-violet-600 text-white"
                                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                        }`}
                                >
                                    <div className="font-semibold mb-1">
                                        {new Date(session.timestamp).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US')}
                                    </div>
                                    <div className="text-[10px] opacity-70 truncate">
                                        {new Date(session.timestamp).toLocaleTimeString(language === 'nl' ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        {session.summary ? ` · ${session.summary}` : ` · ${session.messages.length} ${t('chat.messages')}`}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Area: Transcript */}
                <div className="flex-1 flex flex-col min-h-0">
                    {selectedSession ? (
                        <>
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-200">
                                        {t('chat.sessionFrom')} {new Date(selectedSession.timestamp).toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US')}
                                    </h3>
                                    <p className="text-xs text-slate-500">{selectedSession.messages.length} {t('chat.messages')}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm(t('chat.deleteSession'))) {
                                            onDeleteSession(selectedSession.id);
                                            setSelectedSession(null);
                                        }
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20"
                                >
                                    {t('common.delete')}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {selectedSession.messages.map(m => (
                                    <div
                                        key={m.id}
                                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === "user"
                                                ? "bg-slate-700 text-slate-200"
                                                : "bg-slate-900 text-slate-400"
                                                }`}
                                        >
                                            <span className="font-bold block mb-0.5 text-[10px] uppercase opacity-50">
                                                {m.role}
                                            </span>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
                            {t('chat.selectSession')}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
