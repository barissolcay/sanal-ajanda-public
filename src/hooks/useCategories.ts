// useCategories Hook - Category management for React components
import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../domain/types';
import { DEFAULT_CATEGORIES } from '../domain/types';
import * as categoryRepository from '../data/categoryRepository';

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
    // Loading sırasında DEFAULT_CATEGORIES göster, sonra DB'den güncel veri gelir
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Load categories
    const loadCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const loaded = await categoryRepository.getAllCategories();
            setCategories(loaded);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load categories'));
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
