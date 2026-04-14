"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Video, 
  Globe, 
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Project {
  id: string;
  clientName: string;
  type: 'Video' | 'Website';
  description: string;
  amount: number;
  status: 'Pending' | 'Completed';
  paymentStatus: 'Paid' | 'Unpaid';
  deadline: string;
}

const Business = () => {
  const [projects, setProjects] = useLocalStorage<Project[]>('focusos-projects', []);
  const [filter, setFilter] = useState<'All' | 'Video' | 'Website'>('All');
  const [isAdding, setIsAdding] = useState(false);

  const [newProject, setNewProject] = useState<Partial<Project>>({
    type: 'Video',
    status: 'Pending',
    paymentStatus: 'Unpaid'
  });

  const addProject = (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
      id: crypto.randomUUID(),
      clientName: newProject.clientName || 'New Client',
      type: newProject.type as any,
      description: newProject.description || '',
      amount: Number(newProject.amount) || 0,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      deadline: newProject.deadline || new Date().toISOString().split('T')[0],
    };

    setProjects([project, ...projects]);
    setIsAdding(false);
    toast.success('Project added to CRM');
  };

  const filteredProjects = projects.filter(p => filter === 'All' || p.type === filter);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              {['All', 'Video', 'Website'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    filter === f ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all glow-blue"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>

          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8"
            >
              <form onSubmit={addProject} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Client Name</label>
                  <input 
                    required
                    type="text" 
                    onChange={e => setNewProject({...newProject, clientName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Project Type</label>
                  <select 
                    onChange={e => setNewProject({...newProject, type: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="Video">Video Editing</option>
                    <option value="Website">Website Development</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Amount ($)</label>
                  <input 
                    required
                    type="number" 
                    onChange={e => setNewProject({...newProject, amount: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Description</label>
                  <input 
                    type="text" 
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Deadline</label>
                  <input 
                    type="date" 
                    onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-white/40 font-bold hover:text-white">Cancel</button>
                  <button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue">Create Project</button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ y: -4 }}
                className="glass-card p-6 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      project.type === 'Video' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {project.type === 'Video' ? <Video size={24} /> : <Globe size={24} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{project.clientName}</h3>
                      <p className="text-xs text-white/40">{project.description}</p>
                    </div>
                  </div>
                  <button className="p-2 text-white/20 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Amount</p>
                    <p className="text-sm font-bold text-emerald-500">${project.amount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Status</p>
                    <div className="flex items-center gap-1">
                      {project.status === 'Completed' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} className="text-amber-500" />}
                      <p className="text-sm font-bold">{project.status}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Payment</p>
                    <p className={cn(
                      "text-sm font-bold",
                      project.paymentStatus === 'Paid' ? "text-emerald-500" : "text-rose-500"
                    )}>{project.paymentStatus}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-white/40">
                    <Calendar size={14} />
                    <span className="text-xs font-medium">Due: {project.deadline}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold hover:bg-white/10 transition-all">Edit</button>
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-bold hover:bg-blue-700 transition-all">Details</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Business;