// Dexie Database Definition for Sanal Ajandam V2
import Dexie, { Table } from 'dexie';
import type { Task, Settings, Category } from '../domain/types';
import { DEFAULT_CATEGORIES } from '../domain/types';

export class SanalAjandamDB extends Dexie {
    tasks!: Table<Task, string>;
    settings!: Table<Settings, number>;
    categories!: Table<Category, string>;

    constructor() {
        super('SanalAjandamDB');

        // Version 1: Initial schema
        this.version(1).stores({
            tasks: 'id, startDate, endDate, status, category, priority, createdAt, updatedAt',
            settings: 'id',
        });

        // Version 2: Add categories table and color field to tasks
        this.version(2).stores({
            tasks: 'id, startDate, endDate, status, category, priority, color, createdAt, updatedAt',
            settings: 'id',
            categories: 'id, name, isDefault, order',
        }).upgrade(async tx => {
            // Add default categories on upgrade
            const categoriesTable = tx.table('categories');
            const existingCount = await categoriesTable.count();

            if (existingCount === 0) {
                await categoriesTable.bulkAdd(DEFAULT_CATEGORIES);
            }
        });
    }
}

export const db = new SanalAjandamDB();

// Initialize default categories if not exist
export async function initializeCategories(): Promise<void> {
    const count = await db.categories.count();
    if (count === 0) {
        await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    }
}
