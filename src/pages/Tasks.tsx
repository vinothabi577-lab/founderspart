"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Plus, 
  Play, 
  Pause, 
  CheckCircle2, 
  Trash2, 
  Clock,
  Bell,
  Check,
  RotateCcw,
  FileText,
  CalendarDays,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendSystemNotification } from '@/utils/notifications';
import { shouldNotifyTask, notify } from '@/utils/notificationHelper';

type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  duration: number; // in minutes
  timeLeft: number; // seconds remaining
  targetEndTime?: number; // timestamp when it should finish
  status: 'pending' | 'running' | 'paused' | 'completed';
  deadline: string;
  createdAt: string;
  isDaily?: boolean;
  lastNotifiedAt?: number;
  priority: Priority;
  lastReminderAt?: number; // timestamp of last reminder
  lastCompletedAt?: string; // ISO string of when it was last finished
}

interface DailySummary {
  date: string;
  content: string;
  savedAt: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('focusos-tasks', []);
  const [summaries, setSummaries] = useLocalStorage<DailySummary[]>('focusos-summaries', []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(25);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [isDaily, setIsDaily] = useState(false);
  const [currentSummary, setCurrentSummary] = useState('');
  const [showNextDayReminder, setShowNextDayReminder] = useState(false);
  const [, setTick] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset daily tasks if it's a new day
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setTasks(prevTasks => {
      let changed = false;
      const updated = prevTasks.map(task => {
        if (task.isDaily && task.status === 'completed' && task.lastCompletedAt) {
          const lastFinishedDate = format(parseISO(task.lastCompletedAt), 'yyyy-MM-dd');
          if (lastFinishedDate !== today) {
            changed = true;
            return {
              ...task,
              status: 'pending',
              timeLeft: task.duration * 60,
              lastNotifiedAt: Date.now(),
              lastReminderAt: Date.now(),
              targetEndTime: undefined
            };
          }
        }
        return task;
      });
      return changed ? updated : prevTasks;
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);
      
      setTasks(prevTasks => {
        let changed = false;
        const now = Date.now();
        const oneHour = 3600000;
        const tenMinutes = 600000;
        
        const updated = prevTasks.map(task => {
          let updatedTask = { ...task };

          // Daily task hourly reminder (if not completed)
          if (task.isDaily && task.status !== 'completed') {
            const lastNotify = task.lastNotifiedAt || new Date(task.createdAt).getTime();
            if (now - lastNotify >= oneHour) {
              notify("Daily Task Reminder", `Don't forget to finish: ${task.title}`);
              updatedTask.lastNotifiedAt = now;
              changed = true;
            }
          }

          // Regular task 10-minute reminder (if still pending/not started)
          if (task.status === 'pending' && !task.isDaily) {
            const lastRem = task.lastReminderAt || new Date(task.createdAt).getTime();
            if (now - lastRem >= tenMinutes) {
              notify("Task Reminder", `You haven't started your task: ${task.title}`);
              updatedTask.lastReminderAt = now;
              changed = true;
            }
          }

          // Timer running logic
          if (task.status === 'running' && task.targetEndTime) {
            const secondsLeft = Math.max(0, Math.round((task.targetEndTime - now) / 1000));
            const minutesLeft = Math.ceil(secondsLeft / 60);

            if (shouldNotifyTask(task.id, minutesLeft)) {
              notify("Task Timer", `${task.title} – ${minutesLeft}m left`);
            }

            if (now >= task.targetEndTime) {
              changed = true;
              toast.success(`Timer finished for "${task.title}"`);
              sendSystemNotification("Timer Finished!", `Time is up for: ${task.title}`);
              return { ...updatedTask, timeLeft: 0, status: 'paused', targetEndTime: undefined };
            }

            return { ...updatedTask, timeLeft: secondsLeft };
          }
          
          return updatedTask;
        });
        
        return changed ? updated : prevTasks;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setTasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    const now = Date.now();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      duration: newTaskDuration,
      timeLeft: newTaskDuration * 60,
      status: 'pending',
      deadline: format(new Date(now + 3600000), "yyyy-MM-dd'T'HH:mm"),
      createdAt: new Date().toISOString(),
      isDaily: isDaily,
      lastNotifiedAt: now,
      priority: newTaskPriority,
      lastReminderAt: now,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsDaily(false);
    setNewTaskPriority('medium');
    toast.success(isDaily ? 'Daily task added' : 'Task added');
  };

  const saveSummary = () => {
    if (!currentSummary.trim()) {
      toast.error("Please write something in your summary");
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const newSummary: DailySummary = {
      date: today,
      content: currentSummary,
      savedAt: new Date().toISOString()
    };

    setSummaries([newSummary, ...summaries]);
    setCurrentSummary('');
    setShowNextDayReminder(true);
    toast.success("Daily summary saved!");
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'running') {
          const remaining = Math.max(0, Math.round((t.targetEndTime! - Date.now()) / 1000));
          return { ...t, status: 'paused', timeLeft: remaining, targetEndTime: undefined };
        } else {
          const target = Date.now() + (t.timeLeft * 1000);
          return { ...t, status: 'running', targetEndTime: target };
        }
      }
      if (t.status === 'running') {
        const remaining = Math.max(0, Math.round((t.targetEndTime! - Date.now()) / 1000));
        return { ...t, status: 'paused', timeLeft: remaining, targetEndTime: undefined };
      }
      return t;
    }));
  };

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status: 'completed', 
          timeLeft: 0, 
          targetEndTime: undefined,
          lastCompletedAt: new Date().toISOString()
        };
      }
      return t;
    }));
    toast.success("Task finished for today!");
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.error('Task deleted');
  };

  const formatTime = (task: Task) => {
    let seconds = task.timeLeft;
    if (task.status === 'running' && task.targetEndTime) {
      seconds = Math.max(0, Math.round((task.targetEndTime - Date.now()) / 1000));
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'high': return <ArrowUpCircle size={14} className="text-rose-500" />;
      case 'medium': return <AlertCircle size={14} className="text-amber-500" />;
      case 'low': return <ArrowDownCircle size={14} className="text-blue-500" />;
    }
  };

  const dailyTasks = tasks.filter(t => t.isDaily);
  const regularTasks = tasks.filter(t => !t.isDaily);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
          {/* Task Creation Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <form onSubmit={addTask} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What are you focusing on today?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative w-32">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input 
                      type="number" 
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all glow-blue">
                    <Plus size={20} /> Add Task
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Priority:</span>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTaskPriority(p)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                          newTaskPriority === p 
                            ? p === 'high' ? "bg-rose-500/20 border-rose-500 text-rose-500" 
                              : p === 'medium' ? "bg-amber-500/20 border-amber-500 text-amber-500"
                              : "bg-blue-500/20 border-blue-500 text-blue-500"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center",
                    isDaily ? "bg-blue-600 border-blue-600" : "bg-white/5 border-white/10 group-hover:border-white/30"
                  )}>
                    {isDaily && <Check size={12} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isDaily}
                    onChange={(e) => setIsDaily(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">Daily Task</span>
                </label>
              </div>
            </form>
          </motion.div>

          {/* Next Day Reminder */}
          <AnimatePresence>
            {showNextDayReminder && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center glow-blue">
                    <CalendarDays size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400">Plan for Tomorrow</h4>
                    <p className="text-sm text-white/60">Great job finishing today's summary! What are your goals for the next day?</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNextDayReminder(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Got it
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daily Tasks Section */}
          {dailyTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <RotateCcw size={20} className="text-orange-500" /> Daily Tasks
                <span className="text-sm text-orange-500 font-normal">(Hourly Reminders)</span>
              </h3>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {dailyTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "glass-card p-6 flex items-center justify-between group",
                        task.status === 'running' && "border-orange-500/30 bg-orange-500/[0.05]"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                          task.status === 'completed' ? "bg-orange-500/20 border-orange-500 text-orange-500" : "border-white/10 text-white/40"
                        )}>
                          {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={cn("text-lg font-bold", task.status === 'completed' && "text-white/30 line-through")}>{task.title}</h3>
                            {getPriorityIcon(task.priority)}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">DAILY</span>
                            <span className="text-xs text-white/40 flex items-center gap-1"><Bell size={12} /> Hourly Alerts</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className={cn("text-2xl font-mono font-bold", task.status === 'running' ? "text-orange-500" : "text-white/60")}>
                            {formatTime(task)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {task.status !== 'completed' && (
                            <>
                              <button onClick={() => toggleTask(task.id)} className={cn("p-3 rounded-xl transition-all", task.status === 'running' ? "bg-amber-500/10 text-amber-500" : "bg-orange-600 text-white glow-orange")}>
                                {task.status === 'running' ? <Pause size={20} /> : <Play size={20} />}
                              </button>
                              <button onClick={() => completeTask(task.id)} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                                <Check size={20} />
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteTask(task.id)} className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-rose-500 transition-all">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Regular Tasks Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Regular Tasks</h3>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {regularTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "glass-card p-6 flex items-center justify-between group",
                      task.status === 'running' && "border-blue-500/30 bg-blue-500/[0.05]"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                        task.status === 'completed' ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "border-white/10 text-white/40"
                      )}>
                        {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={cn("text-lg font-bold", task.status === 'completed' && "text-white/30 line-through")}>{task.title}</h3>
                          {getPriorityIcon(task.priority)}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-white/40 flex items-center gap-1"><Bell size={12} /> {format(new Date(task.deadline), 'HH:mm')}</span>
                          <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">{task.duration} MINS</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={cn("text-2xl font-mono font-bold", task.status === 'running' ? "text-blue-500" : "text-white/60")}>
                          {formatTime(task)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.status !== 'completed' && (
                          <>
                            <button onClick={() => toggleTask(task.id)} className={cn("p-3 rounded-xl transition-all", task.status === 'running' ? "bg-amber-500/10 text-amber-500" : "bg-blue-600 text-white glow-blue")}>
                              {task.status === 'running' ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <button onClick={() => completeTask(task.id)} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                              <Check size={20} />
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteTask(task.id)} className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-rose-500 transition-all">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Daily Summary Section */}
          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                <FileText size={20} />
              </div>
              <h3 className="text-xl font-bold">Daily Summary</h3>
            </div>
            
            <div className="glass-card p-6 space-y-4">
              <textarea 
                value={currentSummary}
                onChange={(e) => setCurrentSummary(e.target.value)}
                placeholder="What did you achieve today? Any blockers or wins?"
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-blue-500/50 transition-all resize-none text-sm"
              />
              <div className="flex justify-end">
                <button 
                  onClick={saveSummary}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all glow-blue"
                >
                  Save Today's Summary
                </button>
              </div>
            </div>

            {summaries.length > 0 && (
              <div className="mt-8 space-y-4">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest px-2">Previous Summaries</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summaries.slice(0, 4).map((summary, idx) => (
                    <div key={idx} className="glass-card p-4 bg-white/[0.02]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-500">{format(new Date(summary.date), 'MMMM do, yyyy')}</span>
                        <span className="text-[10px] text-white/20">{format(new Date(summary.savedAt), 'HH:mm')}</span>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-3">{summary.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tasks;