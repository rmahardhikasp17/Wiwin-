
import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  budgetLimit?: number;
  color: string;
  createdAt: Date;
}

export interface Setting {
  id?: number;
  key: string;
  value: any;
}

export class DompetDatabase extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  settings!: Table<Setting>;

  constructor() {
    super('DompetDatabase');
    this.version(1).stores({
      transactions: '++id, type, amount, description, category, date, createdAt',
      categories: '++id, name, type, budgetLimit, color, createdAt',
      settings: '++id, key, value'
    });
  }
}

export const db = new DompetDatabase();

// Initialize default categories
export const initializeDatabase = async () => {
  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkAdd([
      { name: 'Gaji', type: 'income', color: '#10B981', createdAt: new Date() },
      { name: 'Freelance', type: 'income', color: '#059669', createdAt: new Date() },
      { name: 'Makanan', type: 'expense', color: '#EF4444', budgetLimit: 500000, createdAt: new Date() },
      { name: 'Transport', type: 'expense', color: '#F97316', budgetLimit: 200000, createdAt: new Date() },
      { name: 'Hiburan', type: 'expense', color: '#8B5CF6', budgetLimit: 300000, createdAt: new Date() },
      { name: 'Belanja', type: 'expense', color: '#EC4899', budgetLimit: 400000, createdAt: new Date() }
    ]);
  }
};
