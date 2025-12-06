import React from 'react';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

interface SummaryModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    summary: string | null;
    isLoading: boolean;
    onRegenerate: () => void;
}

export default function SummaryModal({
    open,
    onClose,
    title,
    summary,
    isLoading,
    onRegenerate
}: SummaryModalProps) {
    const { t } = useLanguage();
    return (
        <Modal open={open} title={title} onClose={onClose} className="max-w-3xl h-[80vh]">
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="space-y-4 animate-pulse p-4">
                            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-800 rounded w-full"></div>
                            <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-800 rounded w-4/5"></div>
                            <div className="h-20 bg-slate-800/50 rounded w-full mt-6"></div>
                        </div>
                    ) : summary ? (
                        <div className="prose prose-invert prose-sm max-w-none p-4">
                            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed font-light text-base">
                                {summary}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 italic">
                            {t('summary.empty')}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center shrink-0 mt-4">
                    <div className="text-xs text-slate-500">
                        {t('summary.footer')}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onRegenerate}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            {isLoading ? t('summary.regenerating') : t('summary.regenerate')}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
