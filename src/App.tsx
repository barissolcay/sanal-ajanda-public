// App Root Component
import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AppRoutes } from './routes';
import { supabase } from './lib/supabaseClient';
import { LoginPage } from './pages/LoginPage';
import { Session } from '@supabase/supabase-js';
import { SidebarProvider } from './context/SidebarContext';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false); // Stop loading on change
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
                Yükleniyor...
            </div>
        );
    }

    if (!session) {
        return <LoginPage />;
    }

    return (
        <BrowserRouter>
            <SidebarProvider>
                <AppShell>
                    <AppRoutes />
                </AppShell>
            </SidebarProvider>
        </BrowserRouter>
    );
};

export default App;
