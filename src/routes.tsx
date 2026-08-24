// Routes configuration
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { TodayPage } from './pages/TodayPage';
import { WeekPage } from './pages/WeekPage';
import { MonthPage } from './pages/MonthPage';
import { YearPage } from './pages/YearPage';
import { ListsPage } from './pages/ListsPage';
import { OverduePage } from './pages/OverduePage';
import { CompletedPage } from './pages/CompletedPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotesPage } from './pages/NotesPage';

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Dashboard - Home */}
            <Route path="/" element={<DashboardPage />} />

            {/* Calendar Views */}
            <Route path="/today" element={<TodayPage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/month" element={<MonthPage />} />
            <Route path="/year" element={<YearPage />} />

            {/* Lists & Notes */}
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:category" element={<ListsPage />} />
            <Route path="/notes" element={<NotesPage />} />

            {/* Other */}
            <Route path="/overdue" element={<OverduePage />} />
            <Route path="/completed" element={<CompletedPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

