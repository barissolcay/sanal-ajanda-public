// useCategories Hook - Category management for React components
import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../domain/types';
import { DEFAULT_CATEGORIES } from '../domain/types';
import * as categoryRepository from '../data/categoryRepository';

const CATEGORIES_CACHE_KEY = 'sanal_ajandam_categories_cache';

// localStorage'dan cache'lenmiş kategorileri yükle
function getCachedCategories(): Category[] {
    try {
        const cached = localStorage.getItem(CATEGORIES_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to parse cached categories:', e);
    }
    return DEFAULT_CATEGORIES;
}

// Kategorileri localStorage'a kaydet
function cacheCategories(categories: Category[]): void {
    try {
        localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
    } catch (e) {
        console.warn('Failed to cache categories:', e);
    }
}

export interface UseCategoriesReturn {
    categories: Category[];
    loading: boolean;
    error: Error | null;
    createCategory: (data: Omit<Category, 'id' | 'order'>) => Promise<Category>;
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'isDefault'>>) => Promise<Category | undefined>;
    deleteCategory: (id: string) => Promise<boolean>;
    refreshCategories: () => Promise<void>;
    getCategoryById: (id: string) => Category | undefined;
    getCategoryColor: (id: string) => string;
}

export function useCategories(): UseCategoriesReturn {
    // Önce localStorage cache'den yükle, yoksa DEFAULT_CATEGORIES kullan
    const [categories, setCategories] = useState<Category[]>(getCachedCategories);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Load categories
    const loadCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const loaded = await categoryRepository.getAllCategories();
            setCategories(loaded);
            // Başarılı yüklemeden sonra cache'e kaydet
            cacheCategories(loaded);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load categories'));
            // Hata durumunda cache'den yüklenmiş veriyi koru
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Create category
    const createCategory = useCallback(async (data: Omit<Category, 'id' | 'order'>) => {
        const newCategory = await categoryRepository.createCategory(data);
        await loadCategories();
        return newCategory;
    }, [loadCategories]);

    // Update category
    const updateCategory = useCallback(async (id: string, updates: Partial<Omit<Category, 'id' | 'isDefault'>>) => {
        const updated = await categoryRepository.updateCategory(id, updates);
        if (updated) {
            await loadCategories();
        }
        return updated;
    }, [loadCategories]);

    // Delete category
    const deleteCategory = useCallback(async (id: string) => {
        const result = await categoryRepository.deleteCategory(id);
        if (result) {
            await loadCategories();
        }
        return result;
    }, [loadCategories]);

    // Get category by ID
    const getCategoryById = useCallback((id: string) => {
        return categories.find(c => c.id === id);
    }, [categories]);

    // Get category color
    const getCategoryColor = useCallback((id: string) => {
        const category = categories.find(c => c.id === id);
        return category?.color || '#64748b';
    }, [categories]);

    return {
        categories,
        loading,
        error,
        createCategory,
        updateCategory,
        deleteCategory,
        refreshCategories: loadCategories,
        getCategoryById,
        getCategoryColor,
    };
}
