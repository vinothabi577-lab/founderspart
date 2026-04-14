"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Plus, 
  Video, 
  Globe, 
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Work {
  id: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Completed';
  paymentStatus: 'Paid' | 'Unpaid';
  date: string;
}

interface Client {
  id: string;
  name: string;
  type: 'Video' | 'Website';
  works: Work[];
}

const Business = () => {
  const [clients, setClients] = useLocalStorage<Client[]>('focusos-clients-v2', []);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  
  // Form states
  const [newClient, setNewClient] = useState({ name: '', type: 'Video' as const });
  const [newWork, setNewWork] = useState({ description: '', amount: 0, clientId: '' });

  const addClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;

    const client: Client = {
      id: crypto.randomUUID(),
      name: newClient.name,
      type: newClient.type,
      works: []
    };

    setClients([client, ...clients]);
    setNewClient({ name: '', type: 'Video' });
    setIsAddingClient(false);
    toast.success(`Account created for ${client.name}`);
  };

  const addWork = (clientId: string) => {
    if (!newWork.description.trim() || newWork.amount <= 0) {
      toast.error("Please enter work details and amount");
      return;
    }

    const work: Work = {
      id: crypto.randomUUID(),
      description: newWork.description,
      amount: newWork.amount,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      date: new Date().toISOString().split('T')[0]
    };

    setClients(clients.map(c => {
      if (c.id === clientId) {
        return { ...c, works: [work, ...c.works] };
      }
      return c;
    }));

    setNewWork({ description: '', amount: 0, clientId: '' });
    toast.success("Work added to client account");
  };

  const toggleWorkStatus = (clientId: string, workId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          works: c.works.map(w => {
            if (w.id === workId) {
              const newStatus = w.status === 'Pending' ? 'Completed' : 'Pending';
              toast.success(`Work marked as ${newStatus}`);
              return { ...w, status: newStatus };
            }
            return w;
          })
        };
      }
      return c;
    }));
  };

  const togglePaymentStatus = (clientId: string, workId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          works: c.works.map(w => {
            if (w.id === workId) {
              const newStatus = w.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
              toast.success(`Payment marked as ${newStatus}`);
              return { ...w, paymentStatus: newStatus };
            }
            return w;
          })
        };
      }
      return c;
    }));
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    toast.error("Client account removed");
  };

  const deleteWork = (clientId: string, workId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return { ...c, works: c.works.filter(w => w.id !== workId) };
      }
      return c;
    }));
    toast.error("Work entry removed");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Client Accounts</h2>
              <p className="text-sm text-white/40">Manage recurring clients and work history</p>
            </div>
            <button 
              onClick={() => setIsAddingClient(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all glow-blue"
            >
              <Plus size={20} />
              New Client Account
            </button>
          </div>

          {isAddingClient && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <form onSubmit={addClient} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Client Name</label>
                  <input 
                    required
                    type="text" 
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Primary Type</label>
                  <select 
                    value={newClient.type}
                    onChange={e => setNewClient({...newClient, type: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="Video">Video Editing</option>
                    <option value="Website">Website Dev</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsAddingClient(false)} className="px-6 py-3 text-white/40 font-bold">Cancel</button>
                  <button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue">Create Account</button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="space-y-6">
            {clients.map((client) => (
              <div key={client.id} className="glass-card overflow-hidden">
                {/* Client Header */}
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      client.type === 'Video' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {client.type === 'Video' ? <Video size={24} /> : <Globe size={24} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{client.name}</h3>
                      <p className="text-xs text-white/40">{client.works.length} projects recorded</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-white/40 uppercase font-bold">Total Value</p>
                      <p className="text-lg font-bold text-emerald-500">
                        ${client.works.reduce((acc, w) => acc + w.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                        className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      {expandedClientId === client.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedClientId === client.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-white/[0.01]"
                    >
                      <div className="p-6 space-y-6">
                        {/* Add Work Form */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <h4 className="text-xs font-bold text-white/40 uppercase mb-4 flex items-center gap-2">
                            <Plus size={14} /> Add New Work Entry
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input 
                              type="text" 
                              placeholder="Work description..."
                              value={newWork.clientId === client.id ? newWork.description : ''}
                              onChange={e => setNewWork({ ...newWork, description: e.target.value, clientId: client.id })}
                              className="bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-blue-500/50"
                            />
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                              <input 
                                type="number" 
                                placeholder="Amount"
                                value={newWork.clientId === client.id ? newWork.amount : ''}
                                onChange={e => setNewWork({ ...newWork, amount: Number(e.target.value), clientId: client.id })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-8 pr-4 text-sm focus:outline-none focus:border-blue-500/50"
                              />
                            </div>
                            <button 
                              onClick={() => addWork(client.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold py-2 transition-all"
                            >
                              Add Entry
                            </button>
                          </div>
                        </div>

                        {/* Work History List */}
                        <div className="space-y-3">
                          {client.works.map((work) => (
                            <div key={work.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                              <div className="flex items-center gap-4 mb-3 md:mb-0">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                                  <Briefcase size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{work.description}</p>
                                  <p className="text-[10px] text-white/40">{work.date}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4">
                                <div className="text-right mr-4">
                                  <p className="text-sm font-bold text-emerald-500">${work.amount.toLocaleString()}</p>
                                </div>
                                
                                {/* Status Toggles */}
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => toggleWorkStatus(client.id, work.id)}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                      work.status === 'Completed' 
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    )}
                                  >
                                    {work.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    {work.status}
                                  </button>

                                  <button 
                                    onClick={() => togglePaymentStatus(client.id, work.id)}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                      work.paymentStatus === 'Paid' 
                                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" 
                                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    )}
                                  >
                                    <CreditCard size={12} />
                                    {work.paymentStatus}
                                  </button>

                                  <button 
                                    onClick={() => deleteWork(client.id, work.id)}
                                    className="p-1.5 text-white/10 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {client.works.length === 0 && (
                            <p className="text-center py-6 text-white/20 text-sm italic">No work history for this client yet.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {clients.length === 0 && (
              <div className="text-center py-20 glass-card">
                <Briefcase size={48} className="mx-auto text-white/10 mb-4" />
                <h3 className="text-lg font-bold text-white/60">No Client Accounts</h3>
                <p className="text-sm text-white/40">Create your first recurring client account to start tracking work.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Business;