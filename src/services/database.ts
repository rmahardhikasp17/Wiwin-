import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  type: 'income' | 'expense' | 'transfer_to_target';
  amount: number;
  description: string;
  category: string;
  date: string;
  targetId?: number;
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

    // Version 3 - Add targetId to transactions for target savings
    this.version(3).stores({
      transactions: '++id, type, amount, description, category, date, targetId, createdAt',
      categories: '++id, name, type, budgetLimit, color, bulan, tahun, createdAt, [bulan+tahun]',
      targets: '++id, nama, nominalTarget, bulanMulai, tahunMulai, bulanSelesai, tahunSelesai, createdAt',
      settings: '++id, key, value'
    });

    // Version 4 - Simplify categories to fixed income set and remove expense categories
    this.version(4).stores({
      transactions: '++id, type, amount, description, category, date, targetId, createdAt',
      categories: '++id, name, type, budgetLimit, color, bulan, tahun, createdAt, [bulan+tahun]',
      targets: '++id, nama, nominalTarget, bulanMulai, tahunMulai, bulanSelesai, tahunSelesai, createdAt',
      settings: '++id, key, value'
    }).upgrade(async trans => {
      const allowedIncome = ['W2-phone', 'Amel cake', 'Bagaskent gaming center'];
      const defaultColors: Record<string, string> = {
        'W2-phone': '#10B981',
        'Amel cake': '#059669',
        'Bagaskent gaming center': '#14B8A6'
      };
      const catTable = trans.table('categories');
      const allCats = await catTable.toArray();
      const periods = new Set<string>();
      for (const cat of allCats) {
        if (typeof cat.bulan === 'number' && typeof cat.tahun === 'number') {
          periods.add(`${cat.bulan}-${cat.tahun}`);
        }
        if (cat.type === 'expense' || (cat.type === 'income' && !allowedIncome.includes(cat.name))) {
          if (cat.id != null) {
            await catTable.delete(cat.id);
          }
        }
      }
      if (periods.size === 0) {
        const now = new Date();
        periods.add(`${now.getMonth() + 1}-${now.getFullYear()}`);
      }
      for (const key of periods) {
        const [bulanStr, tahunStr] = key.split('-');
        const bulan = parseInt(bulanStr, 10);
        const tahun = parseInt(tahunStr, 10);
        for (const name of allowedIncome) {
          const exists = await catTable.where(['bulan','tahun']).equals([bulan, tahun]).filter(c => c.type === 'income' && c.name === name).count();
          if (exists === 0) {
            await catTable.add({
              name,
              type: 'income',
              color: defaultColors[name] || '#10B981',
              bulan,
              tahun,
              createdAt: new Date()
            } as any);
          }
        }
      }
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
      { name: 'W2-phone', type: 'income', color: '#10B981', bulan: targetMonth, tahun: targetYear, createdAt: new Date() },
      { name: 'Amel cake', type: 'income', color: '#059669', bulan: targetMonth, tahun: targetYear, createdAt: new Date() },
      { name: 'Bagaskent gaming center', type: 'income', color: '#14B8A6', bulan: targetMonth, tahun: targetYear, createdAt: new Date() }
    ]);
  }
};
