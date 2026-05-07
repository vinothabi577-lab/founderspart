"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSupabaseDailyUpdates, Mood } from '@/hooks/useSupabaseDailyUpdates';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarDays,
  Send,
  Edit3,
  Trash2,
  Smile,
  Meh,
  Frown,
  Zap,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

const MOODS: { value: Mood; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { value: 'great',   label: 'Crushing It',  icon: <Zap size={16} />,    color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  { value: 'good',    label: 'Solid Day',    icon: <Smile size={16} />,  color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  { value: 'neutral', label: 'Just Okay',    icon: <Meh size={16} />,    color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30' },
  { value: 'tough',   label: 'Tough Day',    icon: <Frown size={16} />,  color: 'text-rose-400',    bg: 'bg-rose-400/10 border-rose-400/30' },
];

const getMoodStyle = (mood: Mood) => MOODS.find(m => m.value === mood) || MOODS[1];

const getDateLabel = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date))     return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
};

const getInitials = (email: string, fullName?: string | null) => {
  if (fullName) return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
};

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
];

// Stable color per user based on their email
const getUserColor = (email: string) =>
  AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];

const DailyUpdates = () => {
  const { user } = useAuth();
  const { updatesByDate, myTodayUpdate, loading, submitUpdate, deleteUpdate } = useSupabaseDailyUpdates();

  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood>('good');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await submitUpdate(selectedDate, content, selectedMood);
    setContent('');
    setIsEditing(false);
  };

  const handleEditToday = () => {
    if (myTodayUpdate) {
      setContent(myTodayUpdate.content);
      setSelectedMood(myTodayUpdate.mood);
      setSelectedDate(myTodayUpdate.date);
      setIsEditing(true);
    }
  };

  const sortedDates = Object.keys(updatesByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                <Users size={24} className="text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Daily Updates</h1>
                <p className="text-sm text-white/40">End-of-day check-ins from both co-founders</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <CalendarDays size={14} className="text-white/40" />
              <span className="text-sm text-white/60">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>
          </motion.div>

          {/* Submit / Today's Update Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-8"
          >
            {myTodayUpdate && !isEditing ? (
              /* Already submitted today */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <span className="font-bold text-emerald-400">Today's update submitted!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEditToday}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const mood = getMoodStyle(myTodayUpdate.mood);
                      return (
                        <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold', mood.color, mood.bg)}>
                          {mood.icon} {mood.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-white/30">
                      {format(parseISO(myTodayUpdate.created_at), 'h:mm a')}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{myTodayUpdate.content}</p>
                </div>
              </div>
            ) : (
              /* Submit form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={18} className="text-blue-500" />
                  <h2 className="font-bold text-lg">
                    {isEditing ? 'Edit Today\'s Update' : 'Submit Daily Update'}
                  </h2>
                </div>

                {/* Date picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all text-white w-full md:w-auto"
                  />
                </div>

                {/* Mood selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">How was your day?</label>
                  <div className="flex flex-wrap gap-3">
                    {MOODS.map(mood => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setSelectedMood(mood.value)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                          selectedMood === mood.value
                            ? cn(mood.color, mood.bg)
                            : 'text-white/40 bg-white/5 border-white/10 hover:text-white'
                        )}
                      >
                        {mood.icon}
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Update content */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    What did you accomplish? Any blockers or wins?
                  </label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    rows={5}
                    placeholder={`Example:\n• Closed deal with Client X\n• Fixed the auth bug in checkout\n• Had a tough call — need to revisit pricing strategy\n• Tomorrow: demo prep + investor deck`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-blue-500/50 transition-all resize-none text-sm text-white/80 placeholder:text-white/20"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all glow-blue"
                  >
                    <Send size={16} />
                    {isEditing ? 'Save Changes' : 'Submit Update'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setContent(''); }}
                      className="px-6 py-3 text-white/40 hover:text-white font-medium transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </motion.div>

          {/* Updates Timeline */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">Update History</h2>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Users size={40} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/30 text-sm">No updates yet. Be the first to submit today's update!</p>
              </div>
            ) : (
              <AnimatePresence>
                {sortedDates.map((date, dateIdx) => {
                  const dayUpdates = updatesByDate[date];
                  return (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: dateIdx * 0.05 }}
                      className="space-y-4"
                    >
                      {/* Date label */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                          <span className="text-sm font-bold text-white/60">{getDateLabel(date)}</span>
                          <span className="text-xs text-white/20">{format(parseISO(date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-xs text-white/20">{dayUpdates.length} update{dayUpdates.length !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Update cards — side-by-side on large screens */}
                      <div className={cn(
                        'grid gap-4',
                        dayUpdates.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                      )}>
                        {dayUpdates.map(update => {
                          const mood = getMoodStyle(update.mood);
                          const email = update.profiles?.email || '';
                          const fullName = update.profiles?.full_name;
                          const isMe = update.user_id === user?.id;
                          const avatarColor = getUserColor(email);

                          return (
                            <motion.div
                              key={update.id}
                              layout
                              className={cn(
                                'glass-card p-6 space-y-4 transition-all',
                                isMe && 'border-blue-500/20 bg-blue-500/[0.03]'
                              )}
                            >
                              {/* Card Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                                    avatarColor
                                  )}>
                                    {getInitials(email, fullName)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm">{fullName || email.split('@')[0]}</p>
                                      {isMe && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">You</span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-white/30">{format(parseISO(update.created_at), 'h:mm a')}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold',
                                    mood.color, mood.bg
                                  )}>
                                    {mood.icon}
                                    {mood.label}
                                  </span>
                                  {isMe && (
                                    <button
                                      onClick={() => deleteUpdate(update.id)}
                                      className="p-1.5 rounded-lg text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Content */}
                              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                                {update.content}
                              </p>
                            </motion.div>
                          );
                        })}

                        {/* Placeholder for missing partner update on today */}
                        {isToday(parseISO(date)) && dayUpdates.length === 1 && (
                          <div className="glass-card p-6 border-dashed opacity-40 flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <Clock size={24} className="mx-auto text-white/20" />
                              <p className="text-xs text-white/30">Waiting for partner's update...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DailyUpdates;
