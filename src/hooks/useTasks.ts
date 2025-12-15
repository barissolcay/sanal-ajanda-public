// useTasks Hook - Task management for React components
import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskCategory, TaskStatus } from '../domain/types';
import * as taskRepository from '../data/taskRepository';
import { isTaskInRange, isOverdue } from '../domain/dateUtils';

export interface UseTasksOptions {
    showCompleted?: boolean;
    category?: TaskCategory;
    status?: TaskStatus;
}

export interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    error: Error | null;
    createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
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

    const { showCompleted = true, category, status } = options;

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

            setTasks(loadedTasks);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load tasks'));
        } finally {
            setLoading(false);
        }
    }, [showCompleted, category, status]);

    // Initial load
    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Create task
    const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTask = await taskRepository.createTask(taskData);
        await loadTasks(); // Refresh to apply filters
        return newTask;
    }, [loadTasks]);

    // Update task
    const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
        const updated = await taskRepository.updateTask(id, updates);
        if (updated) {
            await loadTasks();
        }
        return updated;
    }, [loadTasks]);

    // Delete task
    const deleteTask = useCallback(async (id: string) => {
        const result = await taskRepository.deleteTask(id);
        if (result) {
            await loadTasks();
        }
        return result;
    }, [loadTasks]);

    // Update task status
    const updateTaskStatus = useCallback(async (id: string, newStatus: TaskStatus) => {
        const updated = await taskRepository.updateTaskStatus(id, newStatus);
        if (updated) {
            await loadTasks();
        }
        return updated;
    }, [loadTasks]);

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
        updateTask,
        deleteTask,
        updateTaskStatus,
        refreshTasks: loadTasks,
        getTasksInRange,
        getOverdueTasks,
        searchTasks,
    };
}
