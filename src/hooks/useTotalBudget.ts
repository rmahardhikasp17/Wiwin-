import { useMemo } from 'react';
import { useKategoriByPeriode } from './useKategoriByPeriode';

export const useTotalBudget = () => {
  const { categories } = useKategoriByPeriode();

  const totalBudget = useMemo(() => {
    return categories
      .filter(cat => cat.type === 'expense' && cat.budgetLimit)
      .reduce((sum, cat) => sum + (cat.budgetLimit || 0), 0);
  }, [categories]);

  return {
    totalBudget,
    budgetCategories: categories.filter(cat => cat.type === 'expense' && cat.budgetLimit)
  };
};