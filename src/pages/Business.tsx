"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ClientCard from '@/components/business/ClientCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Plus, 
  Video, 
  Globe
} from 'lucide-react';
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

  const addClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    const client: Client = {
      id: crypto.randomUUID(),
      name: newClient.name,
      type: newClient.type,
      works: []
    };
    setClients(prev => [client, ...prev]);
    setNewClient({ name: '', type: 'Video' });
    setIsAddingClient(false);
    toast.success(`Account created for ${client.name}`);
  };

  const addWork = (clientId: string, description: string, amount: number) => {
    const work: Work = {
      id: crypto.randomUUID(),
      description,
      amount,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      date: new Date().toISOString().split('T')[0]
    };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, works: [work, ...c.works] } : c));
    toast.success("Work added to client account");
  };

  const handlePayment = (clientId: string, workId: string) => {
    const client = clients.find(c => c.id === clientId);
    const work = client?.works.find(w => w.id === workId);
    
    if (!client || !work || work.paymentStatus === 'Paid') return;

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: 'Income',
      amount: work.amount,
      category: client.type === 'Video' ? 'Video Editing' : 'Web Dev',
      date: new Date().toISOString().split('T')[0],
      note: `Business Payment: ${client.name} - ${work.description}`
    };

    setTransactions(prev => [tx, ...prev]);
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          works: c.works.map(w => w.id === workId ? { ...w, paymentStatus: 'Paid', status: 'Completed' } : w)
        };
      }
      return c;
    }));
    toast.success(`Payment of $${work.amount} recorded`);
  };

  const markAllAsPaid = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const unpaidWorks = client.works.filter(w => w.paymentStatus === 'Unpaid');
    if (unpaidWorks.length === 0) {
      toast.info("All works are already paid");
      return;
    }

    const newTransactions: Transaction[] = unpaidWorks.map(w => ({
      id: crypto.randomUUID(),
      type: 'Income',
      amount: w.amount,
      category: client.type === 'Video' ? 'Video Editing' : 'Web Dev',
      date: new Date().toISOString().split('T')[0],
      note: `Business Payment: ${client.name} - ${w.description}`
    }));

    setTransactions(prev => [...newTransactions, ...prev]);
    setClients(prev => prev.map(c => c.id === clientId ? {
      ...c,
      works: c.works.map(w => ({ ...w, paymentStatus: 'Paid', status: 'Completed' }))
    } : c));
    toast.success(`All ${unpaidWorks.length} projects marked as paid`);
  };

  const deleteWork = (clientId: string, workId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, works: c.works.filter(w => w.id !== workId) } : c));
    toast.error("Work entry deleted");
  };

  const videoClients = clients.filter(c => c.type === 'Video');
  const webClients = clients.filter(c => c.type === 'Website');

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 space-y-12">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Business CRM</h2><p className="text-sm text-white/40">Track recurring clients and revenue</p></div>
            <button onClick={() => setIsAddingClient(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 glow-blue transition-all"><Plus size={20} /> New Client</button>
          </div>

          {isAddingClient && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <form onSubmit={addClient} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Client Name</label><input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" /></div>
                <div className="w-full md:w-48 space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Type</label><select value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all"><option value="Video">Video Editing</option><option value="Website">Website Dev</option></select></div>
                <div className="flex gap-2"><button type="button" onClick={() => setIsAddingClient(false)} className="px-6 py-3 text-white/40 font-bold">Cancel</button><button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue transition-all">Create</button></div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-12">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 px-2">
                <Video size={16} /> Video Editing Clients
              </h3>
              {videoClients.map(client => (
                <ClientCard 
                  key={client.id}
                  client={client}
                  isExpanded={expandedClientId === client.id}
                  onToggle={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                  onAddWork={addWork}
                  onHandlePayment={handlePayment}
                  onMarkAllAsPaid={markAllAsPaid}
                  onDeleteWork={deleteWork}
                />
              ))}
              {videoClients.length === 0 && <p className="text-white/20 text-center py-8 border border-dashed border-white/10 rounded-2xl">No video clients yet</p>}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 px-2">
                <Globe size={16} /> Website Development Clients
              </h3>
              {webClients.map(client => (
                <ClientCard 
                  key={client.id}
                  client={client}
                  isExpanded={expandedClientId === client.id}
                  onToggle={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                  onAddWork={addWork}
                  onHandlePayment={handlePayment}
                  onMarkAllAsPaid={markAllAsPaid}
                  onDeleteWork={deleteWork}
                />
              ))}
              {webClients.length === 0 && <p className="text-white/20 text-center py-8 border border-dashed border-white/10 rounded-2xl">No website clients yet</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Business;