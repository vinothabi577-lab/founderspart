import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BusinessCategory {
  id: string;
  name: string;
  icon_name: string;
  color: string;
}

export interface ClientWork {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Completed';
  payment_status: 'Paid' | 'Unpaid';
  date: string;
}

export interface BusinessClient {
  id: string;
  name: string;
  category_id: string | null;
  works: ClientWork[];
}

export const useSupabaseBusiness = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [clients, setClients] = useState<Omit<BusinessClient, 'works'>[]>([]);
  const [works, setWorks] = useState<ClientWork[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    
    // Fetch categories
    const { data: catData, error: catError } = await supabase
      .from('business_categories')
      .select('*')
      .order('name');
    
    // Fetch clients
    const { data: cliData, error: cliError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch works
    const { data: workData, error: workError } = await supabase
      .from('client_works')
      .select('*')
      .order('date', { ascending: false });

    if (catError) toast.error(catError.message);
    if (cliError) toast.error(cliError.message);
    if (workError) toast.error(workError.message);

    setCategories(catData || []);
    setClients(cliData || []);
    setWorks(workData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const catChannel = supabase
      .channel('business_categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_categories' }, () => fetchAll())
      .subscribe();

    const cliChannel = supabase
      .channel('clients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchAll())
      .subscribe();

    const workChannel = supabase
      .channel('client_works_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_works' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(catChannel);
      supabase.removeChannel(cliChannel);
      supabase.removeChannel(workChannel);
    };
  }, [fetchAll]);

  // Combined data for the UI
  const clientsWithWorks = useMemo(() => {
    return clients.map(client => ({
      ...client,
      works: works.filter(w => w.client_id === client.id)
    }));
  }, [clients, works]);

  // Actions
  const addCategory = async (name: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('business_categories')
      .insert([{ name, created_by: user.id, icon_name: 'Tag', color: 'blue' }]);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  const addClient = async (name: string, category_id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('clients')
      .insert([{ name, category_id, created_by: user.id }]);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  const addWork = async (client_id: string, description: string, amount: number) => {
    const { error } = await supabase
      .from('client_works')
      .insert([{ client_id, description, amount, date: new Date().toISOString().split('T')[0] }]);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  const updateWork = async (workId: string, updates: Partial<ClientWork>) => {
    const { error } = await supabase
      .from('client_works')
      .update(updates)
      .eq('id', workId);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  const deleteWork = async (workId: string) => {
    const { error } = await supabase
      .from('client_works')
      .delete()
      .eq('id', workId);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  const deleteClient = async (clientId: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  return {
    categories,
    clients: clientsWithWorks,
    loading,
    addCategory,
    addClient,
    addWork,
    updateWork,
    deleteWork,
    deleteClient,
    refresh: fetchAll
  };
};
