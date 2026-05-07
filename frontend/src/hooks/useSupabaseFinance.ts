import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  date: string;
  title: string;
  created_by: string;
  created_at: string;
}

export const useSupabaseFinance = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('finance')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('finance_changes')
      .on('postgres_changes', { event: '*', table: 'finance' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTransactions(prev => [payload.new as Transaction, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
        } else if (payload.eventType === 'DELETE') {
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTransaction = async (tx: Partial<Transaction>) => {
    if (!user) return;
    const { error } = await supabase
      .from('finance')
      .insert([{
        ...tx,
        created_by: user.id,
      }]);

    if (error) toast.error(error.message);
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('finance')
      .delete()
      .eq('id', id);

    if (error) toast.error(error.message);
  };

  return { transactions, loading, addTransaction, deleteTransaction, refresh: fetchTransactions };
};
