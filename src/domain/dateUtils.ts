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
} from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Task } from './types';

// ============================================
// DATE FORMATTING
// ============================================

export function formatDate(date: Date | string, formatStr: string = 'dd MMMM yyyy'): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr, { locale: tr });
}

export function formatTime(time: string): string {
    if (!time) return '';
    return time.length > 5 ? time.substring(0, 5) : time;
}

export function formatDateRange(startDate: string, endDate?: string): string {
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
    const dateStr = task.startDate;
    let timeStr = task.startTime || '00:00';
    if (timeStr.length > 5) timeStr = timeStr.substring(0, 5);

    return parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
}

/**
 * Get the logical end datetime of a task
 * (endDate || startDate) + (endTime || '23:59')
 */
export function getTaskEnd(task: Task): Date {
    const dateStr = task.endDate || task.startDate;
    let timeStr = task.endTime || '23:59';
    if (timeStr.length > 5) timeStr = timeStr.substring(0, 5);

    return parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
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
// TASK FILTERING
// ============================================

/**
 * Check if a task overlaps with the given date range
 * Task is in range if: taskEnd >= rangeStart AND taskStart <= rangeEnd
 */
export function isTaskInRange(task: Task, rangeStart: Date, rangeEnd: Date): boolean {
    const taskStart = getTaskStart(task);
    const taskEnd = getTaskEnd(task);

    // Task overlaps with range if:
    // taskEnd >= rangeStart AND taskStart <= rangeEnd
    return !isBefore(taskEnd, rangeStart) && !isAfter(taskStart, rangeEnd);
}

/**
 * Check if a task is overdue
 * Overdue if: now > taskEnd AND status !== 'done'
 */
export function isOverdue(task: Task): boolean {
    if (task.status === 'done' || task.status === 'cancelled') {
        return false;
    }
    const now = new Date();
    const taskEnd = getTaskEnd(task);
    return isAfter(now, taskEnd);
}

/**
 * Check if a task occurs on a specific date
 */
export function isTaskOnDate(task: Task, date: Date): boolean {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    return isTaskInRange(task, dayStart, dayEnd);
}

/**
 * Check if task has a specific time set (not all-day)
 */
export function hasTime(task: Task): boolean {
    return !!task.startTime || !!task.endTime;
}

/**
 * Check if task spans multiple days
 */
export function isMultiDay(task: Task): boolean {
    if (!task.endDate) return false;
    return task.startDate !== task.endDate;
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

export { isSameDay, isSameMonth, isSameYear, parseISO, startOfDay, endOfDay };

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
