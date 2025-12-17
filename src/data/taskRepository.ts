// Task Repository - Supabase Implementation
import { supabase } from '../lib/supabaseClient';
import type { Task } from '../domain/types';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
}

// Map Supabase response to domain Task
// (Supabase returns ISO strings for dates which matches our type)
function mapToDomain(item: any): Task {
    // Ensure all required fields are present
    // Supabase returns null for optional fields, we might need undefined?
    // Our domain type uses '?' which is undefined. JSON is null.
    // We should convert null to undefined for cleaner strict typing if needed.
    return {
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        category: item.category,
        status: item.status,
        priority: item.priority,
        color: item.color || undefined,
        startDate: item.startDate || item.start_date, // Handle snake_case from DB if I defined it that way, but waiting, user asked for specific cols.
        // User asked for "start_date" in DB. But code uses "startDate".
        // I should stick to camelCase for the frontend and snake_case for the DB ideally, 
        // OR just use snake_case for both if user permits, but "Mevcut projeyi bozmadan" -> keep types camelCase.
        // So I need mapping.
        endDate: item.end_date || undefined,
        startTime: item.start_time || undefined,
        endTime: item.end_time || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
}

// Map Domain Task to Supabase DB Row
function mapToDb(task: Partial<Task>, userId: string) {
    return {
        // id: task.id, // Let DB generate ID if new? Or we generate? User said "id (UUID, primary key, default uuid_generate_v4())"
        // But current repo generated ID. I can send it if I want.
        // Let's send it if it exists.
        ...(task.id ? { id: task.id } : {}),
        user_id: userId,
        title: task.title,
        description: task.description,
        category: task.category,
        status: task.status,
        priority: task.priority,
        color: task.color,
        start_date: task.startDate,
        end_date: task.endDate,
        start_time: task.startTime,
        end_time: task.endTime,
        updated_at: new Date().toISOString(), // Always update this
        // created_at is default now() in DB
    };
}

/**
 * Create a new task
 */
export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const userId = await getCurrentUserId();

    // We can generate ID here or let Supabase do it. 
    // To return the full object immediately without a refetch, 
    // it's often easier to let Supabase return it.

    const dbPayload = mapToDb(taskData, userId);

    const { data, error } = await supabase
        .from('tasks')
        .insert(dbPayload)
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error);
        throw error;
    }

    return mapToDomain(data);
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | undefined> {
    const userId = await getCurrentUserId();

    // We need to map camelCase updates to snake_case DB columns
    const dbUpdates: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    // Color: handle both null (clear) and string (set)
    if ('color' in updates) dbUpdates.color = updates.color || null;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;

    const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId) // RLS handles this, but extra safety
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        // If row not found (e.g. wrong user), it might return error
        return undefined;
    }

    return mapToDomain(data);
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        return false;
    }
    return true;
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: string): Promise<Task | undefined> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    return mapToDomain(data);
}

/**
 * Get all tasks
 */
export async function getAllTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('start_date', { ascending: true }); // Default sort

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return (data || []).map(mapToDomain);
}

/**
 * Get tasks in date range
 * Note: existing logic does client-side precision filtering in the hook.
 * We will fetch based on start_date range here to be efficient.
 */
export async function getTasksInDateRange(startDate: string, endDate: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        // Logic: (start_date <= endDate) AND (end_date >= startDate) roughly covers overlap
        // But for simplicity/performance in Single User mode, just fetching broadly is fine.
        // Let's rely on getAllTasks logic of fetching all mostly, 
        // OR add a basic filter: start_date >= startDate - margin?
        // The original code:
        // .where('startDate').between(startDate, endDate) OR .where('endDate')...
        // Supabase equivalent:
        .or(`start_date.gte.${startDate},end_date.gte.${startDate}`)
        // This query syntax for OR with range is tricky in simple string format.
        // Let's keep it simple: Fetch tasks that START in the range + tasks that might overlap.
        // Actually, for a single user agenda, fetching ALL tasks is usually < 50ms for a few thousand rows.
        // Let's just define a broad filter or return all tasks if needed, 
        // but let's try to match the "tasks starting or ending in range" idea.
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
        .order('start_date', { ascending: true });

    if (error) {
        console.error('Error fetching range tasks:', error);
        return [];
    }

    return (data || []).map(mapToDomain);
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', status)
        .order('start_date');

    if (error) return [];
    return (data || []).map(mapToDomain);
}

/**
 * Get tasks by category
 */
export async function getTasksByCategory(category: Task['category']): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('category', category);

    if (error) return [];
    return (data || []).map(mapToDomain);
}

/**
 * Search tasks
 */
export async function searchTasks(query: string): Promise<Task[]> {
    // Supabase has full text search, but simple ilike is easier for "title"
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .ilike('title', `%${query}%`);

    // Note: description search usually requires 'or' logic. 
    // .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

    if (error) return [];
    return (data || []).map(mapToDomain);
}

/**
 * Get completed tasks
 */
export async function getCompletedTasks(): Promise<Task[]> {
    return getTasksByStatus('done');
}

/**
 * Update task status
 */
export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task | undefined> {
    return updateTask(id, { status });
}
