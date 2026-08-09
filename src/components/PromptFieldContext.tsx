'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PromptFieldContextValue {
    selectedNode: any;
    setSelectedNode: (node: any) => void;
    commandActive: boolean;
    setCommandActive: (v: boolean) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (v: boolean) => void;
    isThinking: boolean;
    setIsThinking: (v: boolean) => void;
}

const PromptFieldContext = createContext<PromptFieldContextValue>({
    selectedNode: null,
    setSelectedNode: () => {},
    commandActive: false,
    setCommandActive: () => {},
    sidebarCollapsed: true,
    setSidebarCollapsed: () => {},
    isThinking: false,
    setIsThinking: () => {},
});

export function PromptFieldProvider({ children }: { children: ReactNode }) {
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [commandActive, setCommandActive] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [isThinking, setIsThinking] = useState(false);

    // Sync is-thinking-active class on body
    useEffect(() => {
        document.body.classList.toggle('is-thinking-active', isThinking);
        return () => document.body.classList.remove('is-thinking-active');
    }, [isThinking]);

    // Global ESC handler
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setCommandActive(false);
                setSidebarCollapsed(true);
            }
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, []);

    return (
        <PromptFieldContext.Provider value={{
            selectedNode, setSelectedNode,
            commandActive, setCommandActive,
            sidebarCollapsed, setSidebarCollapsed,
            isThinking, setIsThinking,
        }}>
            {children}
        </PromptFieldContext.Provider>
    );
}

export function usePromptField() {
    return useContext(PromptFieldContext);
}
