'use client';

import React, { useEffect, useState } from 'react';

type PillarKey = 'deepWork' | 'execution' | 'relationship' | 'recovery';

type PillarSetting = {
    id?: string;
    key: PillarKey;
    name: string;
    enabled: boolean;
    dailyTargetMinutes: number | null;
    description: string | null;
};

const PILLAR_LABELS: Record<PillarKey, string> = {
    deepWork: 'Deep Work',
    execution: 'Execution',
    relationship: 'Relationship',
    recovery: 'Recovery',
};

export default function PillarSettingsPage() {
    const [pillars, setPillars] = useState<PillarSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    // Load current pillar settings from API
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/pillars', {
                    method: 'GET',
                });
                if (!res.ok) {
                    throw new Error(`Failed to load pillars: ${res.status}`);
                }
                const data = await res.json();
                const fromApi: PillarSetting[] = (data.pillars || []).map((p: any) => ({
                    id: p.id,
                    key: p.key,
                    name: p.name,
                    enabled: p.enabled,
                    dailyTargetMinutes:
                        typeof p.dailyTargetMinutes === 'number'
                            ? p.dailyTargetMinutes
                            : null,
                    description: p.description ?? null,
                }));

                // Ensure all four keys exist, even if API missed one
                const byKey: Record<PillarKey, PillarSetting> = {
                    deepWork: {
                        key: 'deepWork',
                        name: PILLAR_LABELS.deepWork,
                        enabled: true,
                        dailyTargetMinutes: 120,
                        description:
                            'Long, focused blocks on your most important work.',
                    },
                    execution: {
                        key: 'execution',
                        name: PILLAR_LABELS.execution,
                        enabled: true,
                        dailyTargetMinutes: 90,
                        description:
                            'Shorter tasks, admin, and concrete execution.',
                    },
                    relationship: {
                        key: 'relationship',
                        name: PILLAR_LABELS.relationship,
                        enabled: true,
                        dailyTargetMinutes: 45,
                        description:
                            'Time and energy for important people and conversations.',
                    },
                    recovery: {
                        key: 'recovery',
                        name: PILLAR_LABELS.recovery,
                        enabled: true,
                        dailyTargetMinutes: 60,
                        description:
                            'Rest, movement, and things that recharge you.',
                    },
                };

                for (const p of fromApi) {
                    if (p.key in byKey) {
                        const k = p.key as PillarKey;
                        byKey[k] = {
                            ...byKey[k],
                            ...p,
                            name: p.name || PILLAR_LABELS[k],
                        };
                    }
                }

                setPillars([
                    byKey.deepWork,
                    byKey.execution,
                    byKey.relationship,
                    byKey.recovery,
                ]);
            } catch (e: any) {
                console.error(e);
                setError(String(e?.message || e));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const updatePillar = (key: PillarKey, changes: Partial<PillarSetting>) => {
        setPillars((prev) =>
            prev.map((p) =>
                p.key === key
                    ? { ...p, ...changes }
                    : p
            )
        );
        setSavedMessage(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSavedMessage(null);
        try {
            const payload = pillars.map((p) => ({
                key: p.key,
                name: p.name,
                enabled: p.enabled,
                dailyTargetMinutes:
                    typeof p.dailyTargetMinutes === 'number'
                        ? p.dailyTargetMinutes
                        : null,
                description: p.description ?? null,
            }));

            const res = await fetch('/api/pillars', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to save pillars: ${res.status} ${text}`);
            }

            const data = await res.json();
            const updated: PillarSetting[] = (data.pillars || []).map((p: any) => ({
                id: p.id,
                key: p.key,
                name: p.name,
                enabled: p.enabled,
                dailyTargetMinutes:
                    typeof p.dailyTargetMinutes === 'number'
                        ? p.dailyTargetMinutes
                        : null,
                description: p.description ?? null,
            }));

            // Keep order
            const byKey: Record<PillarKey, PillarSetting> = {
                deepWork: updated.find((p) => p.key === 'deepWork') || pillars.find((p) => p.key === 'deepWork')!,
                execution: updated.find((p) => p.key === 'execution') || pillars.find((p) => p.key === 'execution')!,
                relationship: updated.find((p) => p.key === 'relationship') || pillars.find((p) => p.key === 'relationship')!,
                recovery: updated.find((p) => p.key === 'recovery') || pillars.find((p) => p.key === 'recovery')!,
            };

            setPillars([
                byKey.deepWork,
                byKey.execution,
                byKey.relationship,
                byKey.recovery,
            ]);
            setSavedMessage('Your pillar settings have been saved.');
        } catch (e: any) {
            console.error(e);
            setError(String(e?.message || e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center px-4 py-10">
            <div className="w-full max-w-4xl space-y-6">
                <header className="space-y-2">
                    <h1 className="text-3xl font-semibold">Pillar Settings</h1>
                    <p className="text-slate-300 text-sm">
                        Configure your four core areas: Deep Work, Execution, Relationship, and Recovery.
                        These settings are stored in the database and used by your assistant when you ask about each area.
                    </p>
                </header>

                {loading && (
                    <div className="text-slate-200 text-sm">Loading your pillars…</div>
                )}

                {error && (
                    <div className="text-sm text-red-400 border border-red-500/40 rounded-md px-3 py-2 bg-red-900/20">
                        Error: {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="grid gap-4 md:grid-cols-2">
                            {pillars.map((pillar) => (
                                <div
                                    key={pillar.key}
                                    className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-medium">
                                            {PILLAR_LABELS[pillar.key]}
                                        </h2>
                                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                            <span>{pillar.enabled ? 'Enabled' : 'Disabled'}</span>
                                            <input
                                                type="checkbox"
                                                checked={pillar.enabled}
                                                onChange={(e) =>
                                                    updatePillar(pillar.key, {
                                                        enabled: e.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs text-slate-300">
                                            Display name
                                        </label>
                                        <input
                                            type="text"
                                            value={pillar.name}
                                            onChange={(e) =>
                                                updatePillar(pillar.key, { name: e.target.value })
                                            }
                                            className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm outline-none focus:border-sky-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs text-slate-300">
                                            Daily target (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={
                                                pillar.dailyTargetMinutes !== null &&
                                                    pillar.dailyTargetMinutes !== undefined
                                                    ? pillar.dailyTargetMinutes
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updatePillar(pillar.key, {
                                                    dailyTargetMinutes:
                                                        val === '' ? null : Number(val),
                                                });
                                            }}
                                            className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm outline-none focus:border-sky-400"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            This is how much time you ideally want to spend on this area each day.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs text-slate-300">
                                            Description (how you want this area to work)
                                        </label>
                                        <textarea
                                            value={pillar.description || ''}
                                            onChange={(e) =>
                                                updatePillar(pillar.key, {
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm outline-none focus:border-sky-400 resize-none"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            The assistant will use this to understand what this pillar means for you specifically.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-1">
                                {savedMessage && (
                                    <div className="text-xs text-emerald-400">
                                        {savedMessage}
                                    </div>
                                )}
                                {saving && (
                                    <div className="text-xs text-slate-300">
                                        Saving your changes…
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="inline-flex items-center px-4 py-2 rounded-md bg-sky-500 text-sm font-medium text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-400 transition-colors"
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
