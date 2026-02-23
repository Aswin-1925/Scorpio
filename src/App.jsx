import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Send, History, Settings, X, Trash2, Crown, Globe, ShieldCheck, 
  Cpu, Menu, CheckCircle2, Microscope, Activity, Binary, RefreshCw, Power, 
  ShieldAlert, Gavel, Truck, Search, Briefcase, UserCircle, CreditCard, Sparkles,
  LayoutDashboard, Database, MessageSquare, ChevronLeft, ChevronRight, FileUp
} from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB0as5wtNMh_D472nJPFxa_eBdEgDacI60",
  authDomain: "scropio-89341.firebaseapp.com",
  projectId: "scropio-89341",
  storageBucket: "scropio-89341.firebasestorage.app",
  messagingSenderId: "344477970541",
  appId: "1:344477970541:web:98a853d3ae4ea4070d0f64"
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "scorpio-enterprise-core-v3";

const NODES = [
  { id: 'n1', name: "Science Audit", icon: <Microscope size={18}/>, prompt: "Bio-Regulatory Auditor: Analyze lab notes for errors." },
  { id: 'n2', name: "Legal Log", icon: <Gavel size={18}/>, prompt: "Patent Lawyer: Document actions for invention logging." },
  { id: 'n3', name: "NAMs Report", icon: <ShieldAlert size={18}/>, prompt: "FDA Specialist: Reformat for animal-free reporting." },
  { id: 'n4', name: "Supply Chain", icon: <Truck size={18}/>, prompt: "Logistics Expert: Supply chain risk identification." },
  { id: 'n5', name: "IP Hunter", icon: <Search size={18}/>, prompt: "IP Strategist: Whitespace analysis." },
  { id: 'n6', name: "Patent Cliff", icon: <Briefcase size={18}/>, prompt: "Consultant: Rare disease extension ID." }
];

// --- COMPONENTS ---
const NeuralEngine = () => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(3000), { radius: 5.5 }), []);
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta/30; ref.current.rotation.y -= delta/35; } });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8B1116" size={0.015} sizeAttenuation depthWrite={false} opacity={0.5} />
      </Points>
    </group>
  );
};

const ScorpioLogo = ({ collapsed }) => (
  <div className="flex items-center gap-3 select-none">
    <div className="w-8 h-8 flex items-center justify-center bg-crimson/10 rounded-lg border border-crimson/30">
      <Binary className="text-crimson" size={18} />
    </div>
    {!collapsed && <span className="font-orbitron text-lg font-black tracking-[3px] text-white">SCORPIO</span>}
  </div>
);

// --- MAIN APP ---
export default function App() {
  const [view, setView] = useState('loading'); 
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tier: 'GHOST', usageCount: 0 });
  const [command, setCommand] = useState("");
  const [activeNode, setActiveNode] = useState(NODES[0]);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());
        else await setDoc(userRef, { tier: 'GHOST', usageCount: 0 });
        setView('dash');
      } else { setView('auth'); }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    return onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b)=>b.timestamp-a.timestamp));
    });
  }, [user]);

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setMessages(prev => [...prev, { role: 'user', text: command, node: activeNode.name }]);
    setIsProcessing(true);
    setCommand("");

    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: command, nodePrompt: activeNode.prompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.result, node: activeNode.name }]);
      setUserData(prev => ({ ...prev, usageCount: prev.usageCount + 1 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-silver flex overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@300;400;500;600&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .bg-obsidian { background: #121216; }
        .bg-graphite { background: #1B1B22; }
        .border-crimson-soft { border-color: rgba(139, 17, 22, 0.2); }
        .text-crimson { color: #8B1116; }
        .bg-crimson { background: #8B1116; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1B1B22; border-radius: 10px; }
      `}</style>

      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}><NeuralEngine /></Suspense>
        </Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' && (
           <motion.div key="l" exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#0A0A0C] flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-t-2 border-crimson rounded-full animate-spin mb-4" />
              <p className="font-orbitron text-[9px] tracking-[5px] text-gray-500 uppercase">System Initializing</p>
           </motion.div>
        )}

        {view === 'auth' && (
          <div className="relative z-50 w-full flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-obsidian border border-crimson-soft p-10 rounded-2xl text-center shadow-2xl">
               <div className="flex justify-center mb-10"><ScorpioLogo /></div>
               <p className="text-[11px] font-medium uppercase tracking-[2px] text-gray-500 mb-8">Secure Access Portal</p>
               <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full py-4 bg-graphite hover:bg-white/5 border border-white/5 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-4 shadow-lg">
                <Globe size={18} className="text-crimson" /> Authenticate via Google
               </button>
            </div>
          </div>
        )}

        {view === 'dash' && (
          <div className="flex-1 flex relative z-10 w-full">
            {/* --- SIDEBAR (Compact + Structured) --- */}
            <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-obsidian border-r border-crimson-soft transition-all duration-300 flex flex-col relative`}>
               <div className="h-20 flex items-center px-6 border-b border-white/5">
                  <ScorpioLogo collapsed={isSidebarCollapsed} />
               </div>

               <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
                  <p className={`text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-4 mt-6 ${isSidebarCollapsed && 'hidden'}`}>Control Hub</p>
                  {[
                    { id: 'dash', name: 'Dashboard', icon: <LayoutDashboard size={18}/> },
                    { id: 'nodes', name: 'Neural Nodes', icon: <Database size={18}/> },
                    { id: 'billing', name: 'Billing/Quota', icon: <CreditCard size={18}/> },
                    { id: 'settings', name: 'Settings', icon: <Settings size={18}/> }
                  ].map(item => (
                    <div key={item.id} className="group flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <div className="text-gray-500 group-hover:text-crimson">{item.icon}</div>
                      {!isSidebarCollapsed && <span className="text-[13px] font-medium text-gray-400 group-hover:text-white">{item.name}</span>}
                    </div>
                  ))}

                  <p className={`text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-4 mt-10 ${isSidebarCollapsed && 'hidden'}`}>Intelligence Nodes</p>
                  {NODES.map(node => (
                    <div key={node.id} onClick={() => setActiveNode(node)} className={`group flex items-center gap-4 px-3 py-3 rounded-lg cursor-pointer transition-all ${activeNode.id === node.id ? 'bg-crimson/10 border border-crimson/20' : 'hover:bg-white/[0.02]'}`}>
                      <div className={activeNode.id === node.id ? "text-crimson" : "text-gray-500 group-hover:text-gray-300"}>{node.icon}</div>
                      {!isSidebarCollapsed && <span className={`text-[13px] font-medium ${activeNode.id === node.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>{node.name}</span>}
                    </div>
                  ))}
               </nav>

               {/* Sidebar Collapser */}
               <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-24 w-6 h-6 bg-graphite border border-crimson-soft rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-colors z-20">
                  {isSidebarCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
               </button>

               <div className="p-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-3 px-3 py-2 bg-black/40 rounded-xl border border-white/5">
                     <div className="w-8 h-8 rounded-lg bg-crimson flex items-center justify-center font-bold text-white text-xs">{user.email[0].toUpperCase()}</div>
                     {!isSidebarCollapsed && <div className="flex-1 overflow-hidden"><p className="text-xs font-bold text-white truncate">{user.displayName || 'Auditor'}</p><p className="text-[9px] text-gray-500 uppercase">{userData.tier} Node</p></div>}
                  </div>
                  <button onClick={() => signOut(auth)} className="w-full flex items-center gap-4 px-3 py-3 text-gray-500 hover:text-red-500 transition-colors">
                    <Power size={18}/> {!isSidebarCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Deactivate</span>}
                  </button>
               </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0C]">
              <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-obsidian/50 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-white">{activeNode.name}</h2>
                    <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-1 rounded uppercase tracking-widest font-bold">L3 Processing</span>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] font-bold text-green-500 uppercase">Uplink Stable</span>
                    </div>
                    <button className="px-5 py-2 bg-crimson text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(139,17,22,0.3)] hover:scale-105 transition-all">
                       Upgrade to Spectre
                    </button>
                 </div>
              </header>

              <main className="flex-1 overflow-hidden flex flex-col relative">
                {/* Chat Stream */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-20">
                         <Sparkles size={48} className="mb-6 text-crimson" />
                         <p className="font-orbitron text-xs tracking-[8px] uppercase">Awaiting Protocol Initialization</p>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                           <div className={`max-w-[80%] p-6 rounded-2xl border ${m.role === 'ai' ? 'bg-graphite border-crimson-soft' : 'bg-crimson text-white border-transparent shadow-lg'}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                              <div className={`mt-4 text-[9px] font-bold uppercase opacity-40 ${m.role === 'ai' ? 'text-crimson' : 'text-white'}`}>
                                {m.role === 'ai' ? `${m.node} Agent` : 'Operator Context'}
                              </div>
                           </div>
                        </motion.div>
                      ))
                    )}
                    {isProcessing && <div className="flex justify-start animate-pulse"><div className="bg-graphite p-6 rounded-2xl border border-crimson-soft flex items-center gap-3"><RefreshCw className="animate-spin text-crimson" size={16}/><span className="text-[10px] font-bold uppercase tracking-widest">Synthesizing Node Data...</span></div></div>}
                </div>

                {/* --- CONSOLE INPUT (Card Style) --- */}
                <div className="p-8 bg-gradient-to-t from-black to-transparent">
                    <div className="max-w-4xl mx-auto bg-obsidian border border-crimson-soft rounded-2xl shadow-2xl p-6 transition-all focus-within:border-crimson/50">
                        <textarea 
                           className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-gray-700 min-h-[100px]"
                           placeholder={`Instruct the ${activeNode.name} node...`}
                           value={command}
                           onChange={(e) => setCommand(e.target.value)}
                           onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handleCommand(e); }}
                        />
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                           <div className="flex items-center gap-2">
                              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setCommand(p => p + ` [Attach: ${e.target.files[0].name}] `)} />
                              <button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-white transition-colors">
                                 <FileUp size={20} />
                              </button>
                              <button className="p-2 text-gray-500 hover:text-white transition-colors">
                                 <Plus size={20} />
                              </button>
                           </div>
                           <div className="flex items-center gap-6">
                              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                                {userData.usageCount} / 5 <span className="text-gray-800 ml-1">Executions</span>
                              </span>
                              <button onClick={handleCommand} disabled={isProcessing || !command.trim()} className="px-6 py-2.5 bg-crimson hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-crimson text-white text-[10px] font-black uppercase tracking-[3px] rounded-lg shadow-lg transition-all flex items-center gap-3">
                                 EXECUTE <Send size={14}/>
                              </button>
                           </div>
                        </div>
                    </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed bottom-10 right-10 z-[500] bg-graphite border-l-4 border-crimson p-6 rounded-r-xl shadow-2xl flex items-center gap-6 max-w-sm">
            <ShieldAlert className="text-crimson shrink-0" size={28} />
            <div className="flex-1"><p className="text-[11px] font-bold text-white uppercase mb-1">Neural Fault</p><p className="text-[10px] text-gray-500 leading-relaxed uppercase">{error}</p></div>
            <button onClick={() => setError(null)}><X size={16} className="text-gray-700 hover:text-white" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}