import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Mood = 'great' | 'good' | 'neutral' | 'tough';

export interface ProfileInfo {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface DailyUpdate {
  id: string;
  user_id: string;
  date: string;
  content: string;
  mood: Mood;
  created_at: string;
  updated_at: string;
  profiles?: ProfileInfo;
}

export const useSupabaseDailyUpdates = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(true);

  // Fetch all profiles so we can manually join them
  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url');
    if (!error && data) {
      const map: Record<string, ProfileInfo> = {};
      data.forEach((p: any) => {
        map[p.id] = { email: p.email, full_name: p.full_name, avatar_url: p.avatar_url };
      });
      setProfilesMap(map);
    }
  }, []);

  const fetchUpdates = useCallback(async () => {
    const { data, error } = await supabase
      .from('daily_updates')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setUpdates((data as DailyUpdate[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchUpdates();

    const channel = supabase
      .channel('daily_updates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_updates' }, () => {
        fetchUpdates();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProfiles, fetchUpdates]);

  const submitUpdate = async (date: string, content: string, mood: Mood) => {
    if (!user) return;

    const { error } = await supabase
      .from('daily_updates')
      .upsert(
        { user_id: user.id, date, content, mood, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      );

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Daily update saved! ✅');
      fetchUpdates();
    }
  };

  const deleteUpdate = async (id: string) => {
    const { error } = await supabase
      .from('daily_updates')
      .delete()
      .eq('id', id);

    if (error) toast.error(error.message);
  };

  // Manually attach profile info to each update
  const updatesWithProfiles: DailyUpdate[] = updates.map(u => ({
    ...u,
    profiles: profilesMap[u.user_id],
  }));

  const myTodayUpdate = updatesWithProfiles.find(
    u => u.user_id === user?.id && u.date === new Date().toISOString().split('T')[0]
  );

  const updatesByDate = updatesWithProfiles.reduce<Record<string, DailyUpdate[]>>((acc, update) => {
    if (!acc[update.date]) acc[update.date] = [];
    acc[update.date].push(update);
    return acc;
  }, {});

  return { updates: updatesWithProfiles, updatesByDate, myTodayUpdate, loading, submitUpdate, deleteUpdate, refresh: fetchUpdates };
};
