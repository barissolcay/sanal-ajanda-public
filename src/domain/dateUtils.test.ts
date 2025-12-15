// Unit Tests for dateUtils
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    getTodayRange,
    getWeekRange,
    getMonthRange,
    getYearRange,
    isTaskInRange,
    isOverdue,
    getTaskStart,
    getTaskEnd,
    isTaskOnDate,
    hasTime,
    isMultiDay,
} from './dateUtils';
import type { Task } from './types';

// Helper to create a mock task
function createTask(overrides: Partial<Task> = {}): Task {
    return {
        id: 'test-1',
        title: 'Test Task',
        category: 'general',
        status: 'pending',
        priority: 0,
        startDate: '2025-12-06',
        createdAt: '2025-12-06T10:00:00Z',
        updatedAt: '2025-12-06T10:00:00Z',
        ...overrides,
    };
}

describe('getTodayRange', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-12-06T15:30:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return correct start and end of today', () => {
        const range = getTodayRange();

        expect(range.start.getFullYear()).toBe(2025);
        expect(range.start.getMonth()).toBe(11); // December (0-indexed)
        expect(range.start.getDate()).toBe(6);
        expect(range.start.getHours()).toBe(0);
        expect(range.start.getMinutes()).toBe(0);

        expect(range.end.getFullYear()).toBe(2025);
        expect(range.end.getMonth()).toBe(11);
        expect(range.end.getDate()).toBe(6);
        expect(range.end.getHours()).toBe(23);
        expect(range.end.getMinutes()).toBe(59);
    });
});

describe('getWeekRange', () => {
    const testDate = new Date('2025-12-06T12:00:00'); // Saturday

    it('should return week starting on Monday when weekStartsOn is 1', () => {
        const range = getWeekRange(testDate, 1);

        // Week should start on Monday Dec 1
        expect(range.start.getDate()).toBe(1);
        expect(range.start.getMonth()).toBe(11);

        // Week should end on Sunday Dec 7
        expect(range.end.getDate()).toBe(7);
        expect(range.end.getMonth()).toBe(11);
    });

    it('should return week starting on Sunday when weekStartsOn is 0', () => {
        const range = getWeekRange(testDate, 0);

        // Week should start on Sunday Nov 30
        expect(range.start.getDate()).toBe(30);
        expect(range.start.getMonth()).toBe(10); // November

        // Week should end on Saturday Dec 6
        expect(range.end.getDate()).toBe(6);
        expect(range.end.getMonth()).toBe(11);
    });
});

describe('getMonthRange', () => {
    it('should return correct month boundaries for December 2025', () => {
        const testDate = new Date('2025-12-15T12:00:00');
        const range = getMonthRange(testDate);

        expect(range.start.getDate()).toBe(1);
        expect(range.start.getMonth()).toBe(11);
        expect(range.start.getFullYear()).toBe(2025);

        expect(range.end.getDate()).toBe(31);
        expect(range.end.getMonth()).toBe(11);
        expect(range.end.getFullYear()).toBe(2025);
    });

    it('should handle February correctly', () => {
        const testDate = new Date('2025-02-15T12:00:00');
        const range = getMonthRange(testDate);

        expect(range.start.getDate()).toBe(1);
        expect(range.end.getDate()).toBe(28); // 2025 is not a leap year
    });

    it('should handle leap year February', () => {
        const testDate = new Date('2024-02-15T12:00:00');
        const range = getMonthRange(testDate);

        expect(range.end.getDate()).toBe(29); // 2024 is a leap year
    });
});

describe('getYearRange', () => {
    it('should return correct year boundaries for 2025', () => {
        const testDate = new Date('2025-06-15T12:00:00');
        const range = getYearRange(testDate);

        expect(range.start.getDate()).toBe(1);
        expect(range.start.getMonth()).toBe(0); // January
        expect(range.start.getFullYear()).toBe(2025);

        expect(range.end.getDate()).toBe(31);
        expect(range.end.getMonth()).toBe(11); // December
        expect(range.end.getFullYear()).toBe(2025);
    });
});

describe('isTaskInRange', () => {
    it('should return true when task is entirely within range', () => {
        const task = createTask({
            startDate: '2025-12-06',
            endDate: '2025-12-06',
        });

        const rangeStart = new Date('2025-12-01T00:00:00');
        const rangeEnd = new Date('2025-12-31T23:59:59');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(true);
    });

    it('should return true when task overlaps start of range', () => {
        const task = createTask({
            startDate: '2025-11-28',
            endDate: '2025-12-05',
        });

        const rangeStart = new Date('2025-12-01T00:00:00');
        const rangeEnd = new Date('2025-12-31T23:59:59');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(true);
    });

    it('should return true when task overlaps end of range', () => {
        const task = createTask({
            startDate: '2025-12-28',
            endDate: '2026-01-05',
        });

        const rangeStart = new Date('2025-12-01T00:00:00');
        const rangeEnd = new Date('2025-12-31T23:59:59');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(true);
    });

    it('should return true when task spans entire range', () => {
        const task = createTask({
            startDate: '2025-11-01',
            endDate: '2026-01-31',
        });

        const rangeStart = new Date('2025-12-01T00:00:00');
        const rangeEnd = new Date('2025-12-31T23:59:59');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(true);
    });

    it('should return false when task is before range', () => {
        const task = createTask({
            startDate: '2025-11-01',
            endDate: '2025-11-15',
        });

        const rangeStart = new Date('2025-12-01T00:00:00');
        const rangeEnd = new Date('2025-12-31T23:59:59');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(false);
    });

    it('should return false when task is after range', () => {
        const task = createTask({
            startDate: '2026-01-15',
            endDate: '2026-01-20',
        });

        const rangeStart = new Date('2025-12-01T00:00:00');
        const rangeEnd = new Date('2025-12-31T23:59:59');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(false);
    });

    it('should handle task without endDate (falls back to startDate)', () => {
        const task = createTask({
            startDate: '2025-12-15',
            endDate: undefined,
        });

        const rangeStart = new Date('2025-12-01T00:00:00');
        const rangeEnd = new Date('2025-12-31T23:59:59');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(true);
    });

    it('should consider time when filtering', () => {
        const task = createTask({
            startDate: '2025-12-06',
            startTime: '14:00',
            endTime: '16:00',
        });

        // Range before the task time
        const rangeStart = new Date('2025-12-06T00:00:00');
        const rangeEnd = new Date('2025-12-06T13:00:00');

        expect(isTaskInRange(task, rangeStart, rangeEnd)).toBe(false);
    });
});

describe('isOverdue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-12-06T15:30:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return true for past pending task', () => {
        const task = createTask({
            startDate: '2025-12-05',
            endDate: '2025-12-05',
            status: 'pending',
        });

        expect(isOverdue(task)).toBe(true);
    });

    it('should return true for past in_progress task', () => {
        const task = createTask({
            startDate: '2025-12-05',
            endDate: '2025-12-05',
            status: 'in_progress',
        });

        expect(isOverdue(task)).toBe(true);
    });

    it('should return false for completed task even if past', () => {
        const task = createTask({
            startDate: '2025-12-05',
            endDate: '2025-12-05',
            status: 'done',
        });

        expect(isOverdue(task)).toBe(false);
    });

    it('should return false for cancelled task even if past', () => {
        const task = createTask({
            startDate: '2025-12-05',
            endDate: '2025-12-05',
            status: 'cancelled',
        });

        expect(isOverdue(task)).toBe(false);
    });

    it('should return false for future task', () => {
        const task = createTask({
            startDate: '2025-12-10',
            endDate: '2025-12-10',
            status: 'pending',
        });

        expect(isOverdue(task)).toBe(false);
    });

    it('should return false for task ending today (still has time)', () => {
        const task = createTask({
            startDate: '2025-12-06',
            endDate: '2025-12-06',
            endTime: '18:00', // Ends at 18:00, current time is 15:30
            status: 'pending',
        });

        expect(isOverdue(task)).toBe(false);
    });

    it('should return true for task that ended earlier today', () => {
        const task = createTask({
            startDate: '2025-12-06',
            endDate: '2025-12-06',
            endTime: '14:00', // Ended at 14:00, current time is 15:30
            status: 'pending',
        });

        expect(isOverdue(task)).toBe(true);
    });
});

describe('getTaskStart and getTaskEnd', () => {
    it('should calculate task start correctly with time', () => {
        const task = createTask({
            startDate: '2025-12-06',
            startTime: '14:30',
        });

        const start = getTaskStart(task);
        expect(start.getHours()).toBe(14);
        expect(start.getMinutes()).toBe(30);
    });

    it('should calculate task start as 00:00 when no time specified', () => {
        const task = createTask({
            startDate: '2025-12-06',
        });

        const start = getTaskStart(task);
        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
    });

    it('should calculate task end correctly with endDate and endTime', () => {
        const task = createTask({
            startDate: '2025-12-06',
            endDate: '2025-12-08',
            endTime: '16:45',
        });

        const end = getTaskEnd(task);
        expect(end.getDate()).toBe(8);
        expect(end.getHours()).toBe(16);
        expect(end.getMinutes()).toBe(45);
    });

    it('should use startDate as endDate when endDate not specified', () => {
        const task = createTask({
            startDate: '2025-12-06',
        });

        const end = getTaskEnd(task);
        expect(end.getDate()).toBe(6);
    });

    it('should use 23:59 as endTime when not specified', () => {
        const task = createTask({
            startDate: '2025-12-06',
        });

        const end = getTaskEnd(task);
        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
    });
});

describe('hasTime', () => {
    it('should return true when startTime is set', () => {
        const task = createTask({ startTime: '10:00' });
        expect(hasTime(task)).toBe(true);
    });

    it('should return true when endTime is set', () => {
        const task = createTask({ endTime: '16:00' });
        expect(hasTime(task)).toBe(true);
    });

    it('should return false when no time is set', () => {
        const task = createTask({});
        expect(hasTime(task)).toBe(false);
    });
});

describe('isMultiDay', () => {
    it('should return true when task spans multiple days', () => {
        const task = createTask({
            startDate: '2025-12-06',
            endDate: '2025-12-08',
        });
        expect(isMultiDay(task)).toBe(true);
    });

    it('should return false when task is single day', () => {
        const task = createTask({
            startDate: '2025-12-06',
            endDate: '2025-12-06',
        });
        expect(isMultiDay(task)).toBe(false);
    });

    it('should return false when endDate is not set', () => {
        const task = createTask({
            startDate: '2025-12-06',
        });
        expect(isMultiDay(task)).toBe(false);
    });
});

describe('isTaskOnDate', () => {
    it('should return true when single-day task is on the date', () => {
        const task = createTask({
            startDate: '2025-12-06',
        });

        expect(isTaskOnDate(task, new Date('2025-12-06'))).toBe(true);
    });

    it('should return true when multi-day task includes the date', () => {
        const task = createTask({
            startDate: '2025-12-05',
            endDate: '2025-12-08',
        });

        expect(isTaskOnDate(task, new Date('2025-12-06'))).toBe(true);
        expect(isTaskOnDate(task, new Date('2025-12-07'))).toBe(true);
    });

    it('should return false when task is not on the date', () => {
        const task = createTask({
            startDate: '2025-12-10',
        });

        expect(isTaskOnDate(task, new Date('2025-12-06'))).toBe(false);
    });
});
