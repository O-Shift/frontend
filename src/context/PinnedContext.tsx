'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PinnedCompetitor {
    domain: string;
    name: string;
    logo: string;
    hasNews: boolean;
}

interface PinnedContextType {
    pinned: PinnedCompetitor[];
    pin: (comp: PinnedCompetitor) => void;
    unpin: (domain: string) => void;
    isPinned: (domain: string) => boolean;
}

const PinnedContext = createContext<PinnedContextType | undefined>(undefined);

export function PinnedProvider({ children }: { children: ReactNode }) {
    // Hardcode some initial state so the user can see it working immediately
    const [pinned, setPinned] = useState<PinnedCompetitor[]>([
        { domain: 'google', name: 'Google', logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=64', hasNews: false },
        { domain: 'apple', name: 'Apple', logo: 'https://www.google.com/s2/favicons?domain=apple.com&sz=64', hasNews: true }
    ]);

    const pin = (comp: PinnedCompetitor) => {
        setPinned(prev => {
            if (prev.find(p => p.domain === comp.domain)) return prev;
            return [...prev, comp];
        });
    };

    const unpin = (domain: string) => {
        setPinned(prev => prev.filter(p => p.domain !== domain));
    };

    const isPinned = (domain: string) => {
        return pinned.some(p => p.domain === domain);
    };

    return (
        <PinnedContext.Provider value={{ pinned, pin, unpin, isPinned }}>
            {children}
        </PinnedContext.Provider>
    );
}

export function usePinned() {
    const context = useContext(PinnedContext);
    if (context === undefined) {
        throw new Error('usePinned must be used within a PinnedProvider');
    }
    return context;
}
