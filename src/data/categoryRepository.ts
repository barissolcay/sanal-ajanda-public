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
// Bu fonksiyon her varsayılan kategoriyi tek tek kontrol eder ve eksik olanları ekler
async function ensureDefaultsExist(userId: string): Promise<void> {
    // Önce mevcut kategorilerin ID'lerini al
    const { data: existingCategories, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId);

    if (fetchError) {
        console.error('Failed to fetch existing categories:', fetchError);
        throw fetchError;
    }

    // Mevcut kategori ID'lerini bir Set'e dönüştür (hızlı arama için)
    const existingIds = new Set((existingCategories || []).map(c => c.id));

    // Eksik varsayılan kategorileri bul
    const missingDefaults = DEFAULT_CATEGORIES.filter(c => !existingIds.has(c.id));

    if (missingDefaults.length > 0) {
        const defaultsToInsert = missingDefaults.map(c => ({
            id: c.id,
            user_id: userId,
            name: c.name,
            icon: c.icon,
            color: c.color,
            is_default: c.isDefault,
            order: c.order
        }));

        const { error: insertError } = await supabase
            .from('categories')
            .insert(defaultsToInsert);

        if (insertError) {
            console.error('Failed to insert missing default categories:', insertError);
            throw insertError;
        }

        console.log(`Inserted ${missingDefaults.length} missing default categories`);
    }
}

/**
 * Get all categories (sorted by order)
 */
export async function getAllCategories(): Promise<Category[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_CATEGORIES;

    // Varsayılan kategorilerin DB'de olduğundan emin ol
    await ensureDefaultsExist(user.id);

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return DEFAULT_CATEGORIES;
    }

    // ensureDefaultsExist çağrıldı, bu yüzden data her zaman dolu olmalı
    if (!data || data.length === 0) {
        console.warn('No categories found after ensuring defaults, returning defaults');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
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
        .eq('user_id', userId)
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
