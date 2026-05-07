import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  time_left: number; // seconds remaining
  status: TaskStatus;
  assignee_id?: string;
  created_by: string;
  created_at: string;
  due_date?: string;
  is_daily?: boolean;
  priority: Priority;
}

export const useSupabaseTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    // Subscribe to changes
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new as Task, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTask = async (task: Partial<Task>) => {
    if (!user) return;
    const { error } = await supabase
      .from('tasks')
      .insert([{
        ...task,
        created_by: user.id,
        assignee_id: task.assignee_id || user.id,
      }]);

    if (error) toast.error(error.message);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) toast.error(error.message);
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) toast.error(error.message);
  };

  return { tasks, loading, addTask, updateTask, deleteTask, refresh: fetchTasks };
};
