"use client";

import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  duration: number; // in minutes
  timeLeft: number; // in seconds
  status: 'pending' | 'running' | 'paused' | 'completed';
  deadline: string;
  createdAt: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('focusos-tasks', []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(25);

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.status === 'running' && task.timeLeft > 0) {
          const newTimeLeft = task.timeLeft - 1;
          
          if (newTimeLeft === 0) {
            toast.success(`Task "${task.title}" completed!`);
            return { ...task, timeLeft: 0, status: 'completed' };
          }
          
          return { ...task, timeLeft: newTimeLeft };
        }
        return task;
      }));
    }, 1000);

    return () => clearInterval(interval);
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
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    toast.success('Task added successfully');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'running' ? 'paused' : 'running';
        return { ...t, status: newStatus };
      }
      return { ...t, status: t.status === 'running' ? 'paused' : t.status };
    }));
  };

  const completeTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'completed', timeLeft: 0 } : t));
    toast.success("Task marked as completed");
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    toast.error('Task deleted');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all glow-blue">
                  <Plus size={20} /> Add Task
                </button>
              </div>
            </form>
          </motion.div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
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
                        {formatTime(task.timeLeft)}
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
      </main>
    </div>
  );
};

export default Tasks;