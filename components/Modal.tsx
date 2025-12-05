"use client";

import type { ReactNode } from "react";

interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export default function Modal({ open, title, onClose, children, className = "max-w-2xl" }: ModalProps & { className?: string }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={`relative z-50 w-full ${className} rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]`}>
                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
                    <h2 className="text-sm font-semibold tracking-wide text-slate-100">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:bg-white hover:text-slate-900 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto min-h-0 text-sm text-slate-200">
                    {children}
                </div>
            </div>
        </div>
    );
}
