// Routes configuration
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { TodayPage } from './pages/TodayPage';
import { WeekPage } from './pages/WeekPage';
import { MonthPage } from './pages/MonthPage';
import { YearPage } from './pages/YearPage';
import { ListsPage } from './pages/ListsPage';
import { OverduePage } from './pages/OverduePage';
import { CompletedPage } from './pages/CompletedPage';
import { SettingsPage } from './pages/SettingsPage';

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Calendar Views */}
            <Route path="/" element={<TodayPage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/month" element={<MonthPage />} />
            <Route path="/year" element={<YearPage />} />

            {/* Lists */}
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:category" element={<ListsPage />} />

            {/* Other */}
            <Route path="/overdue" element={<OverduePage />} />
            <Route path="/completed" element={<CompletedPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
