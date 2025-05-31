// src/hooks/useItems.ts

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Item } from '../types';

export const useItems = (categoryFilter?: string) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });
        
        // 'all' veya undefined ise filtreleme yapma
        if (categoryFilter && categoryFilter !== 'all') {
          query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'İçerikleri getirirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [categoryFilter]);

  const addItem = async (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .insert([item]) // crypto.randomUUID() yerine Supabase'in ID atamasını beklemek daha güvenli olabilir.
        .select();

      if (error) throw error;
      
      // Düzeltme: Yeni eklenen veriyi mevcut "items" listesinin başına ekle.
      if (data) {
        setItems(prevItems => [...data, ...prevItems]);
      }
      
      return { success: true, data };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İçerik eklenirken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<Item, 'id'>>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (data) {
        setItems(items.map(item => (item.id === id ? data[0] : item)));
      }
      
      return { success: true, data };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İçerik güncellenirken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setItems(items.filter(item => item.id !== id));
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İçerik silinirken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { 
    items, 
    loading, 
    error, 
    addItem, 
    updateItem, 
    deleteItem 
  };
};