// AppShell Component - Main layout wrapper
import React from 'react';
import { Sidebar } from '../nav/Sidebar';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 relative overflow-hidden">
            {/* Background blur blobs */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full bg-indigo-500/40 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

            {/* Layout */}
            <div className="relative z-10 flex h-screen">
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};
