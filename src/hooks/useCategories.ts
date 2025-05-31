import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Category } from '../types';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')  
        .order('category_name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategorileri getirirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (category: Omit<Category, 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category }])
        .select();

      if (error) throw error;
      setCategories([...(data || []), ...categories]);
      return { success: true, data };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori eklerken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (categoryName: string, updates: Partial<Category>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('category_name', categoryName)
        .select();

      if (error) throw error;
      
      setCategories(categories.map(cat => 
        cat.category_name === categoryName ? { ...cat, ...updates } : cat
      ));
      
      return { success: true, data };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori güncellenirken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryName: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('category_name', categoryName);

      if (error) throw error;
      
      setCategories(categories.filter(cat => cat.category_name !== categoryName));
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori silinirken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { 
    categories, 
    loading, 
    error, 
    fetchCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory 
  };
};
