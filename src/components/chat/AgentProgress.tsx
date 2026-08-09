'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { ToolStep } from '@/hooks/use-agent-chat';

/**
 * Seconds since the turn started, ticking once a second.
 *
 * Its own component on purpose: this re-renders every second, and folding it
 * into the chat feed would re-render the whole message list with it.
 *
 * A spinner keeps spinning after a stream dies, so it cannot tell "working"
 * apart from "hung". An advancing number can.
 */
function Elapsed({ since }: { since: number }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const seconds = Math.max(0, Math.floor((now - since) / 1000));
    if (seconds < 2) return null;

    const label = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    // tabular-nums keeps the row from reflowing as the digits change.
    return (
        <span className="tabular-nums text-[var(--text-secondary)]" aria-hidden="true">
            {label}
        </span>
    );
}

/**
 * What the agent is doing, and what it has already finished.
 *
 * Long turns are tool-heavy and the model can be quiet for a while between
 * calls. The finished steps are the evidence that the quiet is work rather
 * than a hang — they come from the backend's tool_result events, so nothing
 * here is invented.
 */
export default function AgentProgress({
    isThinking,
    activeTool,
    steps,
    startedAt,
}: {
    isThinking: boolean;
    activeTool: string | null;
    steps: ToolStep[];
    startedAt: number | null;
}) {
    const liveRef = useRef<HTMLDivElement>(null);

    if (!isThinking && !activeTool && steps.length === 0) return null;

    const current = activeTool ?? (isThinking ? 'Thinking' : null);

    return (
        <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-0.5 shrink-0 flex items-center justify-center">
                    <img src="/mascot.png" alt="" className="w-full h-full object-contain" />
                </div>
                <span>Agent</span>
            </div>

            <div className="w-full max-w-2xl border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl overflow-hidden">
                {/* Finished work, oldest first — a record that survives the step
                    that produced it, unlike the old badge which cleared on
                    tool_result and left nothing behind. */}
                {steps.length > 0 && (
                    <ul className="divide-y divide-[var(--border-color)]">
                        {steps.map((step) => (
                            <li
                                key={step.id}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs text-[var(--text-secondary)]"
                            >
                                {step.done ? (
                                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent,#f97316)]" />
                                ) : (
                                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none text-[var(--text-primary)]" />
                                )}
                                <span className={step.done ? '' : 'text-[var(--text-primary)]'}>
                                    {step.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {current && (
                    <div
                        ref={liveRef}
                        role="status"
                        aria-live="polite"
                        className={`flex items-center gap-3 px-4 py-2.5 text-xs ${
                            steps.length > 0 ? 'border-t border-[var(--border-color)]' : ''
                        }`}
                    >
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none text-[var(--text-primary)]" />
                        <span className="text-[var(--text-primary)] font-medium">
                            {current.replace(/\.\.\.$/, '')}
                        </span>
                        {startedAt !== null && (
                            <span className="ml-auto">
                                <Elapsed since={startedAt} />
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
