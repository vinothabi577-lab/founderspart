"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ClientCard from '@/components/business/ClientCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Plus, 
  Video, 
  Globe,
  Camera,
  Mic,
  Palette,
  Code,
  Smartphone,
  Monitor,
  Headphones,
  PenTool,
  FileText,
  Zap,
  Users,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { shouldNotifyPayment, notify } from '@/utils/notificationHelper';

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
  type: string; // Can be any service type
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

// Service categories with icons and colors
const serviceCategories = [
  { id: 'video-editing', name: 'Video Editing', icon: Video, color: 'purple' },
  { id: 'website-dev', name: 'Website Development', icon: Globe, color: 'blue' },
  { id: 'photo-editing', name: 'Photo Editing', icon: Camera, color: 'pink' },
  { id: 'audio-editing', name: 'Audio Editing', icon: Mic, color: 'green' },
  { id: 'graphic-design', name: 'Graphic Design', icon: Palette, color: 'orange' },
  { id: 'web-apps', name: 'Web Applications', icon: Code, color: 'indigo' },
  { id: 'mobile-dev', name: 'Mobile Development', icon: Smartphone, color: 'teal' },
  { id: 'ui-ux', name: 'UI/UX Design', icon: Monitor, color: 'cyan' },
  { id: 'music-production', name: 'Music Production', icon: Headphones, color: 'violet' },
  { id: 'content-writing', name: 'Content Writing', icon: PenTool, color: 'yellow' },
  { id: 'consulting', name: 'Business Consulting', icon: Briefcase, color: 'red' },
  { id: 'social-media', name: 'Social Media', icon: Users, color: 'rose' },
  { id: 'branding', name: 'Branding', icon: Zap, color: 'amber' },
  { id: 'documentation', name: 'Documentation', icon: FileText, color: 'lime' },
];

const Business = () => {
  const [clients, setClients] = useLocalStorage<Client[]>('focusos-clients-v2', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('focusos-finance', []);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ name: '', type: 'video-editing' });

  // ---- Notification for unpaid works ----
  useEffect(() => {
    clients.forEach(client => {
      client.works.forEach(work => {
        if (work.paymentStatus === 'Unpaid' && shouldNotifyPayment(work.id)) {
          notify(
            "Payment Pending",
            `${client.name} – ${work.description} ($${work.amount}) is awaiting payment.`
          );
        }
      });
    });
  }, [clients]);

  const addClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    
    const category = serviceCategories.find(cat => cat.id === newClient.type);
    const client: Client = {
      id: crypto.randomUUID(),
      name: newClient.name,
      type: newClient.type,
      works: []
    };
    setClients(prev => [client, ...prev]);
    setNewClient({ name: '', type: 'video-editing' });
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

    const category = serviceCategories.find(cat => cat.id === client.type);
    const categoryName = category ? category.name : client.type;

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: 'Income',
      amount: work.amount,
      category: categoryName,
      date: new Date().toISOString().split('T')[0],
      note: `Business Payment: ${client.name} - ${work.description}`
    };

    setTransactions(prev => [tx, ...prev]);
    setClients(prev => prev.map(c => c.id === clientId ? {
      ...c,
      works: c.works.map(w => w.id === workId ? { ...w, paymentStatus: 'Paid', status: 'Completed' } : w)
    } : c));
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

    const category = serviceCategories.find(cat => cat.id === client.type);
    const categoryName = category ? category.name : client.type;

    const newTransactions: Transaction[] = unpaidWorks.map(w => ({
      id: crypto.randomUUID(),
      type: 'Income',
      amount: w.amount,
      category: categoryName,
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

  // Group clients by service category
  const groupedClients = serviceCategories.map(category => ({
    ...category,
    clients: clients.filter(c => c.type === category.id)
  })).filter(group => group.clients.length > 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 space-y-12">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Business CRM</h2><p className="text-sm text-white/40">Track recurring clients and revenue across all services</p></div>
            <button onClick={() => setIsAddingClient(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 glow-blue transition-all">
              <Plus size={20} /> New Client
            </button>
          </div>

          {isAddingClient && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <form onSubmit={addClient} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Client Name</label>
                  <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <div className="w-full md:w-64 space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Service Type</label>
                  <select value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                    {serviceCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsAddingClient(false)} className="px-6 py-3 text-white/40 font-bold">Cancel</button>
                  <button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue transition-all">Create</button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-12">
            {groupedClients.map(group => (
              <div key={group.id} className="space-y-4">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 px-2">
                  <group.icon size={16} className={`text-${group.color}-500`} /> {group.name}
                </h3>
                <div className="space-y-4">
                  {group.clients.map(client => (
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
                  {group.clients.length === 0 && <p className="text-white/20 text-center py-8 border border-dashed border-white/10 rounded-2xl">No {group.name.toLowerCase()} clients yet</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Business;