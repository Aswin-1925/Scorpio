import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, MeshDistortMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Send, History, Settings, X, Pin, Trash2, Crown, Mail, Globe, ShieldCheck, 
  Cpu, Terminal, Menu, User, CheckCircle2, Microscope, Activity, Binary, RefreshCw, Power, 
  ShieldAlert, Gavel, Truck, Search, Briefcase, UserCircle, CreditCard, LifeBuoy, Sparkles,
  FileUp, Laptop, Smartphone, Tablet
} from 'lucide-react';

// --- CONFIG ---
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
const appId = "scorpio-enterprise-core";

const NODES = [
  { id: 'n1', name: "Science Audit", icon: <Microscope size={18}/>, prompt: "Bio-Regulatory Auditor: Analyze for errors and reproducibility." },
  { id: 'n2', name: "Legal Log", icon: <Gavel size={18}/>, prompt: "Patent Lawyer: Document actions for invention logging." },
  { id: 'n3', name: "NAMs Report", icon: <ShieldAlert size={18}/>, prompt: "FDA Specialist: Reformat for animal-free reporting." },
  { id: 'n4', name: "Supply Chain", icon: <Truck size={18}/>, prompt: "Logistics Expert: Global backup supplier identification." },
  { id: 'n5', name: "IP Hunter", icon: <Search size={18}/>, prompt: "IP Strategist: Molecular structure whitespace analysis." },
  { id: 'n6', name: "Patent Cliff", icon: <Briefcase size={18}/>, prompt: "Biotech Consultant: Patent extension identification." }
];

// --- LOGO FIX ---
const ScorpioLogo = () => (
  <div className="flex items-center gap-3 select-none">
    <img 
      src="/scorpio-logo.png" 
      alt="Scorpio" 
      className="h-9 w-auto brightness-110 drop-shadow-[0_0_10px_rgba(139,17,22,0.4)]"
      onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML += '<span class="font-orbitron text-xl font-black text-white italic">SCORPIO</span>'; }}
    />
  </div>
);

const NeuralVFX = () => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 6 }), []);
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta/25; ref.current.rotation.y -= delta/30; } });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8B1116" size={0.02} sizeAttenuation depthWrite={false} opacity={0.3} />
      </Points>
    </group>
  );
};

export default function App() {
  const [view, setView] = useState('loading'); 
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tier: 'GHOST', usageCount: 0 });
  const [command, setCommand] = useState("");
  const [activeNode, setActiveNode] = useState(NODES[0]);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null); // Hardware Bridge

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCommand(prev => prev + ` [File Attached: ${file.name}] `);
    // Future implementation: Firebase Storage upload logic here
  };

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
    <div className="relative min-h-screen bg-[#050506] text-silver font-sans overflow-x-hidden flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;700&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .glass-panel { background: rgba(13, 13, 18, 0.96); backdrop-filter: blur(50px); border: 1px solid rgba(139, 17, 22, 0.15); }
        .glass-card { background: rgba(20, 20, 25, 0.9); border: 1px solid rgba(255, 255, 255, 0.03); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #8B1116; border-radius: 10px; }
      `}</style>

      {/* VFX: Lower Z-Index and Pointer Events None */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#8B1116" />
          <Suspense fallback={null}><NeuralVFX /></Suspense>
        </Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' && (
           <motion.div key="l" exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#050506] flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 border-t-2 border-crimson rounded-full animate-spin mb-8" />
              <p className="font-orbitron text-[10px] font-black tracking-[10px] text-crimson animate-pulse uppercase">Syncing Scorpio...</p>
           </motion.div>
        )}

        {view === 'auth' && (
          <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-50 min-h-screen flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-xl glass-panel p-16 md:p-24 rounded-[5rem] text-center shadow-[0_0_80px_rgba(0,0,0,1)] border-white/5 font-orbitron">
               <div className="flex justify-center mb-16"><ScorpioLogo /></div>
               <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full py-6 glass-card border-white/5 hover:bg-white/5 text-silver font-black uppercase tracking-widest text-[11px] rounded-3xl transition-all flex items-center justify-center gap-5 shadow-2xl"><Globe size={18} className="text-crimson" /> Google Identity Node</button>
            </div>
          </motion.div>
        )}

        {view === 'dash' && (
          <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
            {/* Header: Interaction Zone Safe */}
            <header className="h-24 glass-panel border-b border-white/5 flex items-center justify-between px-6 md:px-16 shadow-2xl relative z-20">
               <div className="flex items-center gap-8">
                  <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:text-crimson transition-colors">
                    <Menu size={28} />
                  </button>
                  <ScorpioLogo />
               </div>
               <div className="flex items-center gap-6">
                  <div className="hidden lg:flex items-center gap-4 px-6 py-2 glass-card rounded-full border-crimson/20">
                     <div className={`w-2 h-2 rounded-full ${userData.tier === 'GHOST' ? 'bg-crimson animate-pulse' : 'bg-green-500'}`} />
                     <span className="text-[10px] font-black text-white uppercase tracking-[2px]">{userData.tier} Node Active</span>
                  </div>
                  <button onClick={() => setIsSubscriptionOpen(true)} className="flex items-center gap-4 bg-gradient-to-r from-crimson to-red-900 px-8 py-3 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                     <Crown size={18} className="text-white" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[2px] font-orbitron">Upgrade</span>
                  </button>
               </div>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                <div className="flex-1 overflow-y-auto p-8 md:p-20 scrollbar-hide flex flex-col gap-10">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <Sparkles size={60} className="mb-6 text-crimson" />
                            <h2 className="text-4xl md:text-6xl font-light text-white mb-4 italic font-orbitron">Agency Standby.</h2>
                            <p className="text-[11px] font-black uppercase tracking-[5px]">Select a Node and provide protocol context.</p>
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`max-w-4xl ${m.role === 'ai' ? 'self-start border-l-2 border-crimson bg-crimson/[0.03]' : 'self-end'} p-8 rounded-[2.5rem] glass-card shadow-2xl`}>
                                <div className="flex items-center gap-3 mb-4 opacity-50 font-orbitron text-[9px] font-black uppercase tracking-widest">
                                    {m.role === 'ai' ? <Cpu size={14} className="text-crimson" /> : <User size={14} />}
                                    {m.role === 'ai' ? `${m.node}_AGENT` : 'USER_UPLINK'}
                                </div>
                                <p className="text-lg md:text-xl font-light text-silver leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            </motion.div>
                        ))
                    )}
                    {isProcessing && <div className="self-start p-8 glass-card rounded-[2.5rem] flex items-center gap-4 animate-pulse"><RefreshCw className="animate-spin text-crimson" size={20} /><span className="text-[10px] font-black uppercase tracking-[3px]">Synthesizing...</span></div>}
                </div>

                {/* Interaction Console */}
                <div className="p-10 bg-gradient-to-t from-[#050506] to-transparent relative z-20">
                    <div className="max-w-4xl mx-auto flex items-center gap-8 bg-black/50 border border-white/5 p-5 rounded-[4rem] relative shadow-2xl focus-within:border-crimson/40 transition-all">
                        {/* Hardware Bridge Button */}
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current.click()} className="p-5 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                            <Plus size={32} />
                        </button>
                        <form onSubmit={handleCommand} className="flex-1 flex items-center">
                            <input type="text" placeholder={`Instruct ${activeNode.name}...`} value={command} onChange={(e) => setCommand(e.target.value)} className="w-full bg-transparent border-none outline-none text-xl font-light text-white placeholder:text-gray-800" />
                            <button type="submit" disabled={isProcessing} className={`ml-4 p-8 bg-crimson text-white rounded-full shadow-2xl transition-all ${isProcessing ? 'opacity-50' : 'hover:scale-110 active:scale-90'}`}><Send size={32} /></button>
                        </form>
                    </div>
                </div>
            </main>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar: Highest Z-Index */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/90 z-[100] backdrop-blur-xl" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 35 }} className="fixed top-0 left-0 h-full w-full max-w-sm glass-panel z-[110] flex flex-col border-r border-white/5 shadow-2xl">
               <div className="p-10 border-b border-white/5 flex justify-between items-center"><ScorpioLogo /><button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:text-white"><X size={28} /></button></div>
               <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
                  <nav className="space-y-4">
                     <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-4">Portal Settings</p>
                     {[{ name: 'Identity', icon: <UserCircle size={20}/> }, { name: 'Support', icon: <LifeBuoy size={20}/> }, { name: 'Subscription', icon: <CreditCard size={20}/>, action: () => setIsSubscriptionOpen(true) }].map(link => (
                        <div key={link.name} onClick={link.action} className="p-5 glass-card rounded-2xl flex items-center gap-6 cursor-pointer hover:border-crimson/40 group transition-all"><div className="text-gray-600 group-hover:text-crimson">{link.icon}</div><span className="text-[11px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">{link.name}</span></div>
                     ))}
                  </nav>
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-4">Neural Nodes</p>
                     {NODES.map(node => (
                        <div key={node.id} onClick={() => { setActiveNode(node); setIsSidebarOpen(false); }} className={`p-5 rounded-2xl cursor-pointer border transition-all flex items-center gap-6 ${activeNode.id === node.id ? 'border-crimson bg-crimson/10' : 'border-white/5 glass-card'}`}><div className={activeNode.id === node.id ? "text-crimson" : "text-gray-600"}>{node.icon}</div><span className={`text-[11px] font-black uppercase tracking-widest ${activeNode.id === node.id ? 'text-white' : 'text-gray-500'}`}>{node.name}</span></div>
                     ))}
                  </div>
                  <div className="space-y-4 pt-10 border-t border-white/5">
                     <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-4 flex items-center gap-4"><History size={16}/> Intelligence Archive</p>
                     <div className="space-y-4">
                        {history.slice(0, 10).map(item => (
                           <div key={item.id} className="p-6 glass-card rounded-2xl border border-white/5 group transition-all"><p className="text-[11px] text-silver/60 italic line-clamp-2">"{item.text}"</p><div className="mt-4 flex justify-between items-center opacity-30 group-hover:opacity-100"><span className="text-[8px] font-black text-crimson uppercase">{item.node}</span><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', item.id))}><Trash2 size={14} className="hover:text-red-500" /></button></div></div>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="p-10 border-t border-white/5"><button onClick={() => signOut(auth)} className="w-full py-5 rounded-2xl bg-white/5 text-gray-600 font-black uppercase text-[10px] tracking-[4px] flex items-center justify-center gap-4 hover:bg-crimson/10 hover:text-crimson transition-all"><Power size={18}/> Deactivate</button></div>
            </motion.aside>
          </>
        )}

        {isSubscriptionOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl font-orbitron">
               <div className="w-full max-w-6xl glass-panel p-16 rounded-[5rem] relative text-center border-white/5 shadow-2xl overflow-hidden">
                  <button onClick={() => setIsSubscriptionOpen(false)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors"><X size={32}/></button>
                  <h2 className="text-4xl font-black text-white tracking-[10px] mb-12 uppercase italic">Operational Agency</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left font-sans">
                     {[{ name: 'GHOST', price: '0' }, { name: 'SPECTRE', price: '24', highlight: true }, { name: 'SINGULARITY', price: '99' }].map((tier) => (
                        <div key={tier.name} className={`p-10 glass-card rounded-[3rem] border border-white/5 ${tier.highlight ? 'border-crimson shadow-[0_0_50px_rgba(139,17,22,0.3)] scale-105' : 'opacity-60'}`}>
                           <h3 className="font-orbitron text-xl font-black mb-2 text-white italic">{tier.name}</h3><p className="text-4xl font-black mb-8 text-white">${tier.price}</p><button className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase transition-all ${tier.highlight ? 'bg-crimson text-white' : 'bg-white/5 text-gray-400'}`}>Engage</button>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
         )}

        {error && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed bottom-12 right-12 z-[400] glass-card border-l-4 border-crimson p-10 flex items-center gap-8 shadow-2xl max-w-md">
            <AlertOctagon className="text-crimson animate-pulse" size={36} /><div className="flex-1"><p className="text-[11px] font-black uppercase tracking-[4px] text-white font-orbitron">Neural Block</p><p className="text-[10px] font-bold text-gray-600 uppercase mt-2 leading-relaxed">{error}</p></div><button onClick={() => setError(null)}><X size={20} className="opacity-30 hover:opacity-100" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-10 px-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center bg-black/40 backdrop-blur-md italic font-black text-[10px] uppercase tracking-[4px] font-orbitron relative z-20">
         <span className="text-gray-800">© 2026 SCORPIO. NEURAL DOMAIN SECURED.</span>
         <div className="flex gap-8 text-gray-900 mt-6 md:mt-0"><span className="hover:text-crimson cursor-pointer">Sovereignty</span><span className="hover:text-crimson cursor-pointer">Legal Encrypt</span></div>
      </footer>
    </div>
  );
}