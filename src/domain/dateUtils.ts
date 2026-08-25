// Date Utilities for Sanal Ajandam V2
import {
    format,
    parse,
    parseISO,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    isBefore,
    isAfter,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    subDays,
    subWeeks,
    subMonths,
    subYears,
    eachDayOfInterval,
    getDay,
    getDaysInMonth,
    isSameDay,
    isSameMonth,
    isSameYear,
    differenceInDays,
    differenceInMinutes,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Task } from './types';

export {
    format,
    parse,
    parseISO,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    isBefore,
    isAfter,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    subDays,
    subWeeks,
    subMonths,
    subYears,
    eachDayOfInterval,
    getDay,
    getDaysInMonth,
    isSameDay,
    isSameMonth,
    isSameYear,
    differenceInDays,
    differenceInMinutes,
};

// ============================================
// DATE FORMATTING
// ============================================

export function formatDate(date?: Date | string | null, formatStr: string = 'dd MMMM yyyy'): string {
    if (!date) return '';
    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        if (isNaN(d.getTime())) return '';
        return format(d, formatStr, { locale: tr });
    } catch {
        return '';
    }
}

export function formatTime(time: string): string {
    if (!time) return '';
    return time.length > 5 ? time.substring(0, 5) : time;
}

export function formatDateRange(startDate?: string, endDate?: string): string {
    if (!startDate) return 'Süresiz Plan';
    if (!endDate || startDate === endDate) {
        return formatDate(startDate, 'd MMM yyyy');
    }
    return `${formatDate(startDate, 'd MMM')} – ${formatDate(endDate, 'd MMM yyyy')}`;
}

export function formatTimeRange(startTime?: string, endTime?: string): string {
    if (!startTime) return '';
    const start = formatTime(startTime);
    if (!endTime) return start;
    const end = formatTime(endTime);
    return `${start} – ${end}`;
}

// ============================================
// TASK START/END CALCULATIONS
// ============================================

/**
 * Get the logical start datetime of a task
 * startDate + (startTime || '00:00')
 */
export function getTaskStart(task: Task): Date {
    if (!task.startDate) return new Date(0);
    const date = parseISO(task.startDate);
    if (task.startTime) {
        const [hours, minutes] = task.startTime.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
    } else {
        date.setHours(0, 0, 0, 0);
    }
    return date;
}

/**
 * Get the logical end datetime of a task
 * endDate + (endTime || '23:59')
 */
export function getTaskEnd(task: Task): Date {
    if (!task.startDate) return new Date(0);
    const endDateStr = task.endDate || task.startDate;
    const date = parseISO(endDateStr);
    if (task.endTime) {
        const [hours, minutes] = task.endTime.split(':').map(Number);
        date.setHours(hours, minutes, 59, 999);
    } else {
        date.setHours(23, 59, 59, 999);
    }
    return date;
}

/**
 * Check if a task has specific start/end times
 */
export function hasTime(task: Task): boolean {
    return Boolean(task.startTime || task.endTime);
}

/**
 * Check if a task spans multiple days
 */
export function isMultiDay(task: Task): boolean {
    if (!task.startDate || !task.endDate) return false;
    return task.startDate !== task.endDate;
}

// ============================================
// TASK FILTERING & SORTING
// ============================================

/**
 * Check if a task falls within a given date range
 */
export function isTaskInRange(task: Task, start: Date, end: Date): boolean {
    if (!task.startDate) return false;
    const taskStart = getTaskStart(task);
    const taskEnd = getTaskEnd(task);

    return (
        (taskStart >= start && taskStart <= end) ||
        (taskEnd >= start && taskEnd <= end) ||
        (taskStart <= start && taskEnd >= end)
    );
}

/**
 * Check if a task is overdue
 * Day-end rule: Tasks are NOT overdue until their deadline date has completely ended.
 */
export function isOverdue(task: Task): boolean {
    if (task.status === 'done' || task.status === 'cancelled') {
        return false;
    }
    if (!task.startDate) {
        return false;
    }

    const todayStart = startOfDay(new Date());
    const taskEndDate = startOfDay(parseISO(task.endDate || task.startDate));

    return isBefore(taskEndDate, todayStart);
}

/**
 * Check if a task is scheduled for a specific date
 */
export function isTaskOnDate(task: Task, date: Date): boolean {
    if (!task.startDate) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const startStr = task.startDate;
    const endStr = task.endDate || task.startDate;

    return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Check if a completed task was overdue before being completed today (Telafi metric)
 */
export function isOverdueCompletedToday(task: Task, today: Date = new Date()): boolean {
    if (task.status !== 'done') return false;
    if (!task.startDate) return false;

    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const completedDate = new Date(task.updatedAt);
    const isCompletedToday = completedDate >= todayStart && completedDate <= todayEnd;

    if (!isCompletedToday) return false;

    const taskEndDate = startOfDay(parseISO(task.endDate || task.startDate));
    return isBefore(taskEndDate, todayStart);
}

export const getPriorityWeight = (p: Task['priority']): number => {
    if (p === 2) return 2; // Yüksek
    if (p === 0) return 1; // Normal
    return 0;              // Düşük (1)
};

/**
 * Sort tasks by status, time, and priority:
 * 1. Active tasks without time (all-day) sorted by priority then title
 * 2. Active tasks with time sorted by startTime then priority
 * 3. Completed/cancelled tasks last
 */
export function sortTasksByPriority(tasks: Task[]): {
    activeNoTime: Task[];
    activeWithTime: Task[];
    completed: Task[];
} {
    const activeNoTime: Task[] = [];
    const activeWithTime: Task[] = [];
    const completed: Task[] = [];

    for (const task of tasks) {
        if (task.status === 'done' || task.status === 'cancelled') {
            completed.push(task);
        } else if (hasTime(task)) {
            activeWithTime.push(task);
        } else {
            activeNoTime.push(task);
        }
    }

    // Sort all-day tasks: High priority first, then title
    activeNoTime.sort((a, b) => {
        const pDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (pDiff !== 0) return pDiff;
        return a.title.localeCompare(b.title);
    });

    // Sort timed tasks: startTime first, then high priority
    activeWithTime.sort((a, b) => {
        const timeDiff = (a.startTime || '').localeCompare(b.startTime || '');
        if (timeDiff !== 0) return timeDiff;
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    });

    // Completed: by time
    completed.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    return { activeNoTime, activeWithTime, completed };
}

// ============================================
// DATE RANGE CALCULATIONS
// ============================================

export interface DateRange {
    start: Date;
    end: Date;
}

export function getTodayRange(): DateRange {
    const now = new Date();
    return {
        start: startOfDay(now),
        end: endOfDay(now),
    };
}

export function getWeekRange(date: Date = new Date(), weekStartsOn: 0 | 1 = 1): DateRange {
    return {
        start: startOfWeek(date, { weekStartsOn }),
        end: endOfWeek(date, { weekStartsOn }),
    };
}

export function getMonthRange(date: Date = new Date()): DateRange {
    return {
        start: startOfMonth(date),
        end: endOfMonth(date),
    };
}

export function getYearRange(date: Date = new Date()): DateRange {
    return {
        start: startOfYear(date),
        end: endOfYear(date),
    };
}

export function getDayRange(date: Date): DateRange {
    return {
        start: startOfDay(date),
        end: endOfDay(date),
    };
}

// ============================================
// CALENDAR HELPERS
// ============================================

export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
    const weekStart = startOfWeek(date, { weekStartsOn });
    return eachDayOfInterval({
        start: weekStart,
        end: endOfWeek(date, { weekStartsOn }),
    });
}

export function getMonthDays(date: Date): Date[] {
    return eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date),
    });
}

export function getCalendarDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
    // Get the month's first and last day
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Extend to full weeks
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function getDayOfWeek(date: Date): number {
    return getDay(date);
}

export function getDaysCount(date: Date): number {
    return getDaysInMonth(date);
}

// ============================================
// NAVIGATION HELPERS
// ============================================

export const navigation = {
    nextDay: (date: Date) => addDays(date, 1),
    prevDay: (date: Date) => subDays(date, 1),
    nextWeek: (date: Date) => addWeeks(date, 1),
    prevWeek: (date: Date) => subWeeks(date, 1),
    nextMonth: (date: Date) => addMonths(date, 1),
    prevMonth: (date: Date) => subMonths(date, 1),
    nextYear: (date: Date) => addYears(date, 1),
    prevYear: (date: Date) => subYears(date, 1),
};

// ============================================
// COMPARISON HELPERS
// ============================================

// ============================================
// TIME SLOT HELPERS
// ============================================

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
}

export function getTimeSlotPosition(time: string, hourHeight: number = 60): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * hourHeight + (minutes / 60) * hourHeight;
}

export function getTimeSlotHeight(startTime: string, endTime: string, hourHeight: number = 60): number {
    const startPos = getTimeSlotPosition(startTime, hourHeight);
    const endPos = getTimeSlotPosition(endTime, hourHeight);
    return Math.max(endPos - startPos, hourHeight / 2); // Minimum half hour height
}

// ============================================
// TODAY HELPERS
// ============================================

export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

export function toDateString(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

export function fromDateString(dateStr: string): Date {
    return parseISO(dateStr);
}
