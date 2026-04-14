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
  CheckCircle2,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Briefcase,
  Check
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

interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  date: string;
  note: string;
}

const Business = () => {
  const [clients, setClients] = useLocalStorage<Client[]>('focusos-clients-v2', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('focusos-finance', []);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  
  const [newClient, setNewClient] = useState({ name: '', type: 'Video' as const });
  const [newWork, setNewWork] = useState({ description: '', amount: 0, clientId: '' });

  const syncToFinance = (amount: number, category: string, note: string) => {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: 'Income',
      amount,
      category,
      date: new Date().toISOString().split('T')[0],
      note: `Business Payment: ${note}`
    };
    setTransactions([tx, ...transactions]);
  };

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
    setClients(clients.map(c => c.id === clientId ? { ...c, works: [work, ...c.works] } : c));
    setNewWork({ description: '', amount: 0, clientId: '' });
    toast.success("Work added to client account");
  };

  const handlePayment = (clientId: string, workId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          works: c.works.map(w => {
            if (w.id === workId && w.paymentStatus === 'Unpaid') {
              syncToFinance(w.amount, c.type === 'Video' ? 'Video Editing' : 'Web Dev', `${c.name} - ${w.description}`);
              toast.success(`Payment of $${w.amount} recorded in Finance`);
              return { ...w, paymentStatus: 'Paid', status: 'Completed' };
            }
            return w;
          })
        };
      }
      return c;
    }));
  };

  const markAllAsPaid = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const unpaidWorks = client.works.filter(w => w.paymentStatus === 'Unpaid');
    if (unpaidWorks.length === 0) {
      toast.info("All works are already paid");
      return;
    }

    unpaidWorks.forEach(w => {
      syncToFinance(w.amount, client.type === 'Video' ? 'Video Editing' : 'Web Dev', `${client.name} - ${w.description}`);
    });

    setClients(clients.map(c => c.id === clientId ? {
      ...c,
      works: c.works.map(w => ({ ...w, paymentStatus: 'Paid', status: 'Completed' }))
    } : c));
    toast.success(`All ${unpaidWorks.length} projects marked as paid and synced to Finance`);
  };

  const videoClients = clients.filter(c => c.type === 'Video');
  const webClients = clients.filter(c => c.type === 'Website');

  const ClientList = ({ list, title, icon: Icon }: any) => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 px-2">
        <Icon size={16} /> {title}
      </h3>
      {list.map((client: Client) => (
        <div key={client.id} className="glass-card overflow-hidden">
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
                <p className="text-xs text-white/40">{client.works.length} projects</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className="text-xs text-white/40 uppercase font-bold">Total Value</p>
                <p className="text-lg font-bold text-emerald-500">
                  ${client.works.reduce((acc, w) => acc + w.amount, 0).toLocaleString()}
                </p>
              </div>
              {expandedClientId === client.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          <AnimatePresence>
            {expandedClientId === client.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-white/[0.01]">
                <div className="p-6 space-y-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input 
                          type="text" placeholder="Work description..."
                          value={newWork.clientId === client.id ? newWork.description : ''}
                          onChange={e => setNewWork({ ...newWork, description: e.target.value, clientId: client.id })}
                          className="bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-blue-500/50"
                        />
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                          <input 
                            type="number" placeholder="Amount"
                            value={newWork.clientId === client.id ? newWork.amount : ''}
                            onChange={e => setNewWork({ ...newWork, amount: Number(e.target.value), clientId: client.id })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-8 pr-4 text-sm focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <button onClick={() => addWork(client.id)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold py-2">Add Entry</button>
                      </div>
                    </div>
                    <button onClick={() => markAllAsPaid(client.id)} className="lg:w-48 py-3 px-4 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 flex items-center justify-center gap-2">
                      <Check size={14} /> Mark All Paid
                    </button>
                  </div>

                  <div className="space-y-3">
                    {client.works.map((work) => (
                      <div key={work.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40"><Briefcase size={16} /></div>
                          <div>
                            <p className="text-sm font-bold">{work.description}</p>
                            <p className="text-[10px] text-white/40">{work.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-bold text-emerald-500">${work.amount.toLocaleString()}</p>
                          {work.paymentStatus === 'Unpaid' ? (
                            <button 
                              onClick={() => handlePayment(client.id, work.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 glow-blue"
                            >
                              <CreditCard size={12} /> Mark as Paid
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 size={12} /> Paid & Completed
                            </div>
                          )}
                          <button onClick={() => setClients(clients.map(c => c.id === client.id ? { ...c, works: c.works.filter(w => w.id !== work.id) } : c))} className="p-1.5 text-white/10 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 space-y-12">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Business CRM</h2><p className="text-sm text-white/40">Track recurring clients and revenue</p></div>
            <button onClick={() => setIsAddingClient(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 glow-blue"><Plus size={20} /> New Client</button>
          </div>

          {isAddingClient && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <form onSubmit={addClient} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Client Name</label><input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50" /></div>
                <div className="w-full md:w-48 space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Type</label><select value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"><option value="Video">Video Editing</option><option value="Website">Website Dev</option></select></div>
                <div className="flex gap-2"><button type="button" onClick={() => setIsAddingClient(false)} className="px-6 py-3 text-white/40 font-bold">Cancel</button><button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue">Create</button></div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-12">
            <ClientList list={videoClients} title="Video Editing Clients" icon={Video} />
            <ClientList list={webClients} title="Website Development Clients" icon={Globe} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Business;