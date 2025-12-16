// Category Repository - Supabase Implementation
import { supabase } from '../lib/supabaseClient';
import type { Category } from '../domain/types';
import { DEFAULT_CATEGORIES } from '../domain/types';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
}

// Helper to ensure defaults exist in DB
async function ensureDefaultsExist(userId: string): Promise<void> {
    const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (count === 0) {
        const defaultsWithUser = DEFAULT_CATEGORIES.map(c => ({
            id: c.id,
            user_id: userId,
            name: c.name,
            icon: c.icon,
            color: c.color,
            is_default: c.isDefault,
            order: c.order
        }));

        const { error } = await supabase.from('categories').insert(defaultsWithUser);
        if (error) {
            console.error('Failed to insert default categories:', error);
            throw error;
        }
    }
}

/**
 * Get all categories (sorted by order)
 */
export async function getAllCategories(): Promise<Category[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_CATEGORIES;

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

    if (error || !data || data.length === 0) {
        // If table doesn't exist or empty, return defaults.
        // In a real scenario, we might want to insert defaults for the user.
        // But for read-only safety if table missing:
        console.warn('Could not fetch categories (or empty), returning defaults:', error);
        return DEFAULT_CATEGORIES;
    }

    // Map DB to Domain
    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        isDefault: item.is_default, // map snake_case
        order: item.order
    }));
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | undefined> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;

    return {
        id: data.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        isDefault: data.is_default,
        order: data.order
    };
}

/**
 * Create a new category
 */
export async function createCategory(categoryData: Omit<Category, 'id' | 'order'>): Promise<Category> {
    const userId = await getCurrentUserId();

    // Ensure defaults exist before adding new one
    await ensureDefaultsExist(userId);

    const id = `custom_${crypto.randomUUID().split('-')[0]}`;

    // Get max order
    const { data: maxOrderData } = await supabase
        .from('categories')
        .select('order')
        .order('order', { ascending: false })
        .limit(1)
        .single();

    const order = (maxOrderData?.order ?? -1) + 1;

    const dbPayload = {
        id,
        user_id: userId,
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        is_default: categoryData.isDefault,
        order,
    };

    const { data, error } = await supabase
        .from('categories')
        .insert(dbPayload)
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        isDefault: data.is_default,
        order: data.order
    };
}

/**
 * Update a category
 */
export async function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'isDefault'>>): Promise<Category | undefined> {
    const userId = await getCurrentUserId();

    // Ensure defaults exist before updating (in case we process an update on a default cat that isn't in DB yet)
    await ensureDefaultsExist(userId);

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.order !== undefined) dbUpdates.order = updates.order;

    const { data, error } = await supabase
        .from('categories')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) return undefined;

    return {
        id: data.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        isDefault: data.is_default,
        order: data.order
    };
}

/**
 * Delete a category (only non-default)
 */
export async function deleteCategory(id: string): Promise<boolean> {
    // Check if default first? Supabase RLS policies could prevent this, or just logic here.
    // Ideally we fetch it first.
    const cat = await getCategoryById(id);
    if (!cat || cat.isDefault) return false;

    // Move tasks with this category to 'general'
    const userId = await getCurrentUserId();
    await supabase
        .from('tasks')
        .update({ category: 'general' })
        .eq('category', id)
        .eq('user_id', userId);

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    return !error;
}

/**
 * Reorder categories
 */
export async function reorderCategories(categoryIds: string[]): Promise<void> {
    const userId = await getCurrentUserId();

    // Naively update one by one. Supabase RPC is better but this works for few categories.
    for (let i = 0; i < categoryIds.length; i++) {
        await supabase
            .from('categories')
            .update({ order: i })
            .eq('id', categoryIds[i])
            .eq('user_id', userId);
    }
}

/**
 * Reset to default categories
 */
export async function resetCategories(): Promise<void> {
    const userId = await getCurrentUserId();

    // Delete all custom, or all? Logic says "Reset".
    // Let's delete all and re-insert defaults.

    // 1. Move tasks
    // This logic is complex to do purely via client if we don't know what is deleted.
    // Simplified: Delete all categories for user. Re-insert defaults.

    await supabase.from('categories').delete().eq('user_id', userId);

    // Insert defaults
    const defaultsWithUser = DEFAULT_CATEGORIES.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        is_default: c.isDefault,
        order: c.order
    }));

    await supabase.from('categories').insert(defaultsWithUser);
}
