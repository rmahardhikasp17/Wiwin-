
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
  bulan: number; // 1-12
  tahun: number; // e.g., 2025
  createdAt: Date;
}

export interface Target {
  id?: number;
  nama: string;
  nominalTarget: number;
  bulanMulai: number;
  tahunMulai: number;
  bulanSelesai: number;
  tahunSelesai: number;
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
  targets!: Table<Target>;
  settings!: Table<Setting>;

  constructor() {
    super('DompetDatabase');
    this.version(1).stores({
      transactions: '++id, type, amount, description, category, date, createdAt',
      categories: '++id, name, type, budgetLimit, color, createdAt',
      settings: '++id, key, value'
    });
    
    // Version 2 - Add month/year to categories and targets table
    this.version(2).stores({
      transactions: '++id, type, amount, description, category, date, createdAt',
      categories: '++id, name, type, budgetLimit, color, bulan, tahun, createdAt, [bulan+tahun]',
      targets: '++id, nama, nominalTarget, bulanMulai, tahunMulai, bulanSelesai, tahunSelesai, createdAt',
      settings: '++id, key, value'
    }).upgrade(async trans => {
      // Migrate existing categories to current month/year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      await trans.table('categories').toCollection().modify(category => {
        category.bulan = currentMonth;
        category.tahun = currentYear;
      });
    });
  }
}

export const db = new DompetDatabase();

// Initialize default categories for specific month/year
export const initializeDatabase = async (bulan?: number, tahun?: number) => {
  const currentDate = new Date();
  const targetMonth = bulan || (currentDate.getMonth() + 1);
  const targetYear = tahun || currentDate.getFullYear();
  
  // Check if there are categories for target month/year
  const categoriesCount = await db.categories
    .where(['bulan', 'tahun'])
    .equals([targetMonth, targetYear])
    .count();
    
  if (categoriesCount === 0) {
    await db.categories.bulkAdd([
      { name: 'Gaji', type: 'income', color: '#10B981', bulan: targetMonth, tahun: targetYear, createdAt: new Date() },
      { name: 'Freelance', type: 'income', color: '#059669', bulan: targetMonth, tahun: targetYear, createdAt: new Date() },
      { name: 'Makanan', type: 'expense', color: '#EF4444', budgetLimit: 500000, bulan: targetMonth, tahun: targetYear, createdAt: new Date() },
      { name: 'Transport', type: 'expense', color: '#F97316', budgetLimit: 200000, bulan: targetMonth, tahun: targetYear, createdAt: new Date() },
      { name: 'Hiburan', type: 'expense', color: '#8B5CF6', budgetLimit: 300000, bulan: targetMonth, tahun: targetYear, createdAt: new Date() },
      { name: 'Belanja', type: 'expense', color: '#EC4899', budgetLimit: 400000, bulan: targetMonth, tahun: targetYear, createdAt: new Date() }
    ]);
  }
};
