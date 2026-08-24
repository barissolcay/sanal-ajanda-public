// useTasks Hook - Task management for React components
import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskCategory, TaskStatus } from '../domain/types';
import * as taskRepository from '../data/taskRepository';
import { isTaskInRange, isOverdue } from '../domain/dateUtils';

export interface UseTasksOptions {
    showCompleted?: boolean;
    category?: TaskCategory;
    status?: TaskStatus;
    hideOverdue?: boolean; // Hide overdue incomplete tasks (for calendar views)
}

export interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    error: Error | null;
    createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
    createTasksBatch: (tasksData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<Task[]>;
    updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<Task | undefined>;
    deleteTask: (id: string) => Promise<boolean>;
    updateTaskStatus: (id: string, status: TaskStatus) => Promise<Task | undefined>;
    refreshTasks: () => Promise<void>;
    getTasksInRange: (start: Date, end: Date) => Task[];
    getOverdueTasks: () => Task[];
    searchTasks: (query: string) => Task[];
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { showCompleted = true, category, status, hideOverdue = false } = options;

    // Helper to check if task matches current filters
    const matchesFilters = useCallback((task: Task): boolean => {
        if (!showCompleted && task.status === 'done') return false;
        if (category && task.category !== category) return false;
        if (status && task.status !== status) return false;
        // Hide overdue incomplete tasks if requested
        if (hideOverdue && task.status !== 'done' && isOverdue(task)) return false;
        return true;
    }, [showCompleted, category, status, hideOverdue]);

    // Load all tasks
    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            let loadedTasks = await taskRepository.getAllTasks();

            // Apply filters
            if (!showCompleted) {
                loadedTasks = loadedTasks.filter(t => t.status !== 'done');
            }
            if (category) {
                loadedTasks = loadedTasks.filter(t => t.category === category);
            }
            if (status) {
                loadedTasks = loadedTasks.filter(t => t.status === status);
            }
            // Hide overdue incomplete tasks if requested
            if (hideOverdue) {
                loadedTasks = loadedTasks.filter(t => !(t.status !== 'done' && isOverdue(t)));
            }

            setTasks(loadedTasks);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load tasks'));
        } finally {
            setLoading(false);
        }
    }, [showCompleted, category, status, hideOverdue]);

    // Initial load
    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Create task with optimistic update
    const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newTask = await taskRepository.createTask(taskData);

            // Optimistic update - only add if it matches filters
            if (matchesFilters(newTask)) {
                setTasks(prev => [...prev, newTask].sort((a, b) =>
                    (a.startDate || '').localeCompare(b.startDate || '')
                ));
            }

            return newTask;
        } catch (err) {
            await loadTasks();
            throw err;
        }
    }, [matchesFilters, loadTasks]);

    // Create tasks in batch
    const createTasksBatch = useCallback(async (tasksData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => {
        try {
            const newTasks = await taskRepository.createTasksBatch(tasksData);
            await loadTasks();
            return newTasks;
        } catch (err) {
            await loadTasks();
            throw err;
        }
    }, [loadTasks]);

    // Update task with optimistic update
    const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => {
                if (t.id !== id) return t;
                return { ...t, ...updates, updatedAt: new Date().toISOString() };
            }));

            const updated = await taskRepository.updateTask(id, updates);
            if (updated) {
                setTasks(prev => {
                    if (!matchesFilters(updated)) {
                        return prev.filter(t => t.id !== id);
                    }
                    return prev.map(t => t.id === id ? updated : t);
                });
            }
            return updated;
        } catch (err) {
            await loadTasks();
            throw err;
        }
    }, [matchesFilters, loadTasks]);

    // Delete task with optimistic update
    const deleteTask = useCallback(async (id: string) => {
        try {
            // Optimistic update - remove immediately
            setTasks(prev => prev.filter(t => t.id !== id));

            const result = await taskRepository.deleteTask(id);
            if (!result) {
                await loadTasks();
            }
            return result;
        } catch (err) {
            await loadTasks();
            throw err;
        }
    }, [loadTasks]);

    // Update task status with optimistic update
    const updateTaskStatus = useCallback(async (id: string, newStatus: TaskStatus) => {
        const taskToUpdate = tasks.find(t => t.id === id);

        try {
            if (taskToUpdate) {
                const optimisticTask = { ...taskToUpdate, status: newStatus };
                if (!matchesFilters(optimisticTask)) {
                    setTasks(prev => prev.filter(t => t.id !== id));
                } else {
                    setTasks(prev => prev.map(t => t.id === id ? optimisticTask : t));
                }
            }

            const updated = await taskRepository.updateTaskStatus(id, newStatus);
            if (updated && matchesFilters(updated)) {
                setTasks(prev => prev.map(t => t.id === id ? updated : t));
            }

            return updated;
        } catch (err) {
            await loadTasks();
            throw err;
        }
    }, [tasks, matchesFilters, loadTasks]);

    // Get tasks in date range (client-side filtering for precision)
    const getTasksInRange = useCallback((start: Date, end: Date) => {
        return tasks.filter(task => isTaskInRange(task, start, end));
    }, [tasks]);

    // Get overdue tasks
    const getOverdueTasks = useCallback(() => {
        return tasks.filter(task => isOverdue(task));
    }, [tasks]);

    // Search tasks
    const searchTasks = useCallback((query: string) => {
        const lowerQuery = query.toLowerCase();
        return tasks.filter(task =>
            task.title.toLowerCase().includes(lowerQuery) ||
            (task.description?.toLowerCase().includes(lowerQuery) ?? false)
        );
    }, [tasks]);

    return {
        tasks,
        loading,
        error,
        createTask,
        createTasksBatch,
        updateTask,
        deleteTask,
        updateTaskStatus,
        refreshTasks: loadTasks,
        getTasksInRange,
        getOverdueTasks,
        searchTasks,
    };
}
