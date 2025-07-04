
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { db, Category } from '../services/database';
import { useKategoriByPeriode } from '../hooks/useKategoriByPeriode';
import { useDateFilterHelper } from '../hooks/useDateFilterHelper';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CategoryWithSpending extends Category {
  currentSpending: number;
  percentage: number;
  status: 'safe' | 'warning' | 'over';
}

const Kategori: React.FC = () => {
  const { categories: rawCategories, loading, addCategory, updateCategory, deleteCategory: removeCategory, getCategorySpending } = useKategoriByPeriode();
  const { bulan, tahun, getFormattedSelection } = useDateFilterHelper();
  const [categories, setCategories] = useState<CategoryWithSpending[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    budgetLimit: '',
    color: '#EF4444'
  });

  const colors = [
    { name: 'Merah', value: '#EF4444' },
    { name: 'Biru', value: '#3B82F6' },
    { name: 'Hijau', value: '#10B981' },
    { name: 'Kuning', value: '#F59E0B' },
    { name: 'Ungu', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Teal', value: '#14B8A6' }
  ];

  useEffect(() => {
    loadCategoriesWithSpending();
  }, [rawCategories, bulan, tahun]);

  const loadCategoriesWithSpending = async () => {
    if (!rawCategories) return;

    try {
      const categoriesWithSpending = await Promise.all(
        rawCategories.map(async (category) => {
          const spending = await getCategorySpending(category.name);
          const percentage = category.budgetLimit ? (spending / category.budgetLimit) * 100 : 0;
          let status: 'safe' | 'warning' | 'over' = 'safe';
          
          if (percentage >= 100) status = 'over';
          else if (percentage >= 80) status = 'warning';
          
          return {
            ...category,
            currentSpending: spending,
            percentage: Math.min(percentage, 100),
            status
          };
        })
      );

      setCategories(categoriesWithSpending);
    } catch (error) {
      console.error('Error loading categories with spending:', error);
      toast.error('Gagal memuat data kategori');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nama kategori harus diisi');
      return;
    }

    try {
      const categoryData = {
        name: formData.name.trim(),
        type: formData.type,
        budgetLimit: formData.budgetLimit ? parseInt(formData.budgetLimit) : undefined,
        color: formData.color
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id!, categoryData);
      } else {
        await addCategory(categoryData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Gagal menyimpan kategori');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      budgetLimit: category.budgetLimit?.toString() || '',
      color: category.color
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
    await removeCategory(categoryId);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      budgetLimit: '',
      color: '#EF4444'
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'over':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'safe':
        return 'Aman';
      case 'warning':
        return 'Peringatan';
      case 'over':
        return 'Melebihi Batas';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Kategori</h1>
            <p className="text-gray-600 mt-1">Periode: {getFormattedSelection()}</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kategori
          </Button>
        </div>

        {/* Form Add/Edit Category */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Makan, Transport, Jajan"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Tipe Kategori</Label>
                <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                    <SelectItem value="income">Pemasukan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budgetLimit">Batas Anggaran (Opsional)</Label>
                <Input
                  id="budgetLimit"
                  type="number"
                  value={formData.budgetLimit}
                  onChange={(e) => setFormData({...formData, budgetLimit: e.target.value})}
                  placeholder="Contoh: 500000"
                />
              </div>

              <div>
                <Label htmlFor="color">Warna Kategori</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({...formData, color: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          ></div>
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                {editingCategory ? 'Perbarui' : 'Simpan'} Kategori
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </form>
        )}

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Pengeluaran Saat Ini</TableHead>
                <TableHead>Batas Anggaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Belum ada kategori. Tambahkan kategori pertama Anda!
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.type === 'income' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(category.currentSpending)}
                    </TableCell>
                    <TableCell>
                      {category.budgetLimit ? formatCurrency(category.budgetLimit) : 'Tidak ada batas'}
                    </TableCell>
                    <TableCell>
                      {category.budgetLimit ? (
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(category.status)}
                          <span className={`text-sm font-medium ${
                            category.status === 'safe' ? 'text-emerald-600' :
                            category.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {getStatusText(category.status)} ({category.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(category.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Kategori;
