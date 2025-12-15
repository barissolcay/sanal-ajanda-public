// SidebarLayout Component - Page wrapper within AppShell
import React from 'react';

interface SidebarLayoutProps {
    children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {children}
        </div>
    );
};
