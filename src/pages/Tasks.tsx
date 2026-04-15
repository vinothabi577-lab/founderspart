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
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendSystemNotification } from '@/utils/notifications';
import { shouldNotifyTask, notify } from '@/utils/notificationHelper';

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
}

const Tasks = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('focusos-tasks', []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(25);
  const [isDaily, setIsDaily] = useState(false);
  const [, setTick] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hourlyNotificationIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);
      
      setTasks(prevTasks => {
        let changed = false;
        const updated = prevTasks.map(task => {
          if (task.status === 'running' && task.targetEndTime) {
            const now = Date.now();
            const secondsLeft = Math.max(0, Math.round((task.targetEndTime - now) / 1000));
            const minutesLeft = Math.ceil(secondsLeft / 60);

            // Notification thresholds
            if (shouldNotifyTask(task.id, minutesLeft)) {
              notify(
                "Task Timer",
                `${task.title} – ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} left`
              );
            }

            // Hourly notification for daily tasks
            if (task.isDaily && !hourlyNotificationIntervals.current.has(task.id)) {
              notify("Daily Task Reminder", `${task.title} - starting your hourly focus session`);
              const hourlyInterval = setInterval(() => {
                notify("Daily Task Reminder", `${task.title} - one hour passed`);
              }, 3600000);
              hourlyNotificationIntervals.current.set(task.id, hourlyInterval);
            }

            if (now >= task.targetEndTime) {
              changed = true;
              toast.success(`Task "${task.title}" completed!`);
              sendSystemNotification("Task Completed!", `You've finished: ${task.title}`);
              
              if (task.isDaily) {
                return {
                  ...task,
                  id: crypto.randomUUID(),
                  timeLeft: task.duration * 60,
                  status: 'pending',
                  targetEndTime: undefined,
                  createdAt: new Date().toISOString(),
                };
              }
              
              return { ...task, timeLeft: 0, status: 'completed', targetEndTime: undefined };
            }

            return { ...task, timeLeft: secondsLeft };
          }
          return task;
        });
        return changed ? updated : prevTasks;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      hourlyNotificationIntervals.current.forEach(interval => clearInterval(interval));
      hourlyNotificationIntervals.current.clear();
    };
  }, [setTasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      duration: newTaskDuration,
      timeLeft: newTaskDuration * 60,
      status: 'pending',
      deadline: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
      createdAt: new Date().toISOString(),
      isDaily: isDaily,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsDaily(false);
    toast.success(isDaily ? 'Daily task added successfully' : 'Task added successfully');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'running') {
          const remaining = Math.max(0, Math.round((t.targetEndTime! - Date.now()) / 1000));
          
          // Clear hourly interval when pausing
          const interval = hourlyNotificationIntervals.current.get(t.id);
          if (interval) {
            clearInterval(interval);
            hourlyNotificationIntervals.current.delete(t.id);
          }
          
          return { ...t, status: 'paused', timeLeft: remaining, targetEndTime: undefined };
        } else {
          const target = Date.now() + (t.timeLeft * 1000);
          return { ...t, status: 'running', targetEndTime: target };
        }
      }
      
      // Pause other running tasks
      if (t.status === 'running') {
        const remaining = Math.max(0, Math.round((t.targetEndTime! - Date.now()) / 1000));
        const interval = hourlyNotificationIntervals.current.get(t.id);
        if (interval) {
          clearInterval(interval);
          hourlyNotificationIntervals.current.delete(t.id);
        }
        return { ...t, status: 'paused', timeLeft: remaining, targetEndTime: undefined };
      }
      return t;
    }));
  };

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const interval = hourlyNotificationIntervals.current.get(id);
        if (interval) {
          clearInterval(interval);
          hourlyNotificationIntervals.current.delete(id);
        }
        return { ...t, status: 'completed', timeLeft: 0, targetEndTime: undefined };
      }
      return t;
    }));
    toast.success("Task marked as completed");
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const interval = hourlyNotificationIntervals.current.get(id);
    if (interval) {
      clearInterval(interval);
      hourlyNotificationIntervals.current.delete(id);
    }
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

  const dailyTasks = tasks.filter(t => t.isDaily);
  const regularTasks = tasks.filter(t => !t.isDaily);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4">
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
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isDaily}
                      onChange={(e) => setIsDaily(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Daily Task</span>
                  </label>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all glow-blue">
                  <Plus size={20} /> Add Task
                </button>
              </div>
            </form>
          </motion.div>

          {dailyTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <RotateCcw size={20} className="text-orange-500" /> Daily Tasks
                <span className="text-sm text-orange-500 font-normal">(Repeat every hour)</span>
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
                          <h3 className={cn("text-lg font-bold", task.status === 'completed' && "text-white/30 line-through")}>{task.title}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">DAILY</span>
                            <span className="text-xs text-white/40 flex items-center gap-1"><Bell size={12} /> {format(new Date(task.deadline), 'HH:mm')}</span>
                            <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">{task.duration} MINS</span>
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
                        <h3 className={cn("text-lg font-bold", task.status === 'completed' && "text-white/30 line-through")}>{task.title}</h3>
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
        </div>
      </main>
    </div>
  );
};

export default Tasks;