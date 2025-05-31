import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { DailyRecommendation } from '../types';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<DailyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_recommendations')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Önerileri getirirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addRecommendation = async (recommendation: Omit<DailyRecommendation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_recommendations')
        .insert([recommendation])
        .select();

      if (error) throw error;
      setRecommendations([...(data || []), ...recommendations]);
      return { success: true, data };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öneri eklerken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateRecommendation = async (id: number, updates: Partial<DailyRecommendation>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_recommendations')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      setRecommendations(recommendations.map(rec => 
        rec.id === id ? { ...rec, ...updates } : rec
      ));
      
      return { success: true, data };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öneri güncellenirken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecommendation = async (id: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('daily_recommendations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecommendations(recommendations.filter(rec => rec.id !== id));
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öneri silinirken bir hata oluştu');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return { 
    recommendations, 
    loading, 
    error, 
    fetchRecommendations, 
    addRecommendation, 
    updateRecommendation, 
    deleteRecommendation 
  };
};
