import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, History, Settings, X, Trash2, Crown, Globe, 
  Binary, RefreshCw, Power, Microscope, Gavel, 
  ShieldAlert, Truck, Search, Briefcase, UserCircle, 
  CreditCard, LayoutDashboard, ChevronLeft, ChevronRight, 
  FileUp, Paperclip, Sparkles, FileText
} from 'lucide-react';

// --- INITIALIZATION ---
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
const appId = "scorpio-prime-v7";

const NODES = [
  { id: 'n1', name: "Science Audit", icon: <Microscope size={14}/>, desc: "Analyze lab notes for chemical variables and errors.", prompt: "Bio-Regulatory Auditor mode." },
  { id: 'n2', name: "Legal Log", icon: <Gavel size={14}/>, desc: "Generate Human-Guided Invention Logs for 2026 patent laws.", prompt: "Patent Lawyer mode." },
  { id: 'n3', name: "NAMs Report", icon: <ShieldAlert size={14}/>, desc: "Reformat data into FDA-compliant animal-free reports.", prompt: "FDA Specialist mode." },
  { id: 'n4', name: "Supply Chain", icon: <Truck size={14}/>, desc: "Scan for chemical supply chain disruptions.", prompt: "Logistics Expert mode." },
  { id: 'n5', name: "IP Hunter", icon: <Search size={14}/>, desc: "Identify whitespace in molecular structures.", prompt: "IP Strategist mode." },
  { id: 'n6', name: "Patent Cliff", icon: <Briefcase size={14}/>, desc: "Identify paths to 6-month patent extensions.", prompt: "Consultant mode." }
];

// --- UPDATED LOGO COMPONENT (Reactive Fallback) ---
const ScorpioLogo = ({ size = "sm", collapsed = false }) => {
  const [imgError, setImgError] = useState(false);
  const dimension = size === "sm" ? "h-8" : "h-12";

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${dimension} aspect-square flex items-center justify-center bg-crimson/5 rounded-lg border border-crimson/20 overflow-hidden`}>
        {imgError ? (
          <Binary className="text-crimson" size={size === "sm" ? 18 : 28} />
        ) : (
          <img 
            src="/scorpio-logo.png" 
            alt="Scorpio Logo"
            className="w-full h-full object-contain p-1.5"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      {!collapsed && <span className={`font-orbitron font-black tracking-[3px] text-white ${size === "sm" ? "text-sm" : "text-2xl"}`}>SCORPIO</span>}
    </div>
  );
};

const NeuralEngine = () => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(3000), { radius: 5.5 }), []);
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta/50; ref.current.rotation.y -= delta/55; } });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8B1116" size={0.01} sizeAttenuation depthWrite={false} opacity={0.5} />
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
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]); 
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const isPro = userData.tier === 'SPECTRE' || userData.tier === 'SINGULARITY';

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());
        else await setDoc(userRef, { tier: 'GHOST', usageCount: 0 });
        setView('dash');
      } else setView('auth');
    });
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = isPro ? 10 : 1;
    if (files.length + stagedFiles.length > maxFiles) {
       setError(`Node Limit: ${maxFiles} files per execution.`);
       return;
    }
    setStagedFiles(prev => [...prev, ...files]);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() && stagedFiles.length === 0 || isProcessing) return;

    const currentText = command;
    const currentFiles = stagedFiles.map(f => f.name);
    setMessages(prev => [...prev, { role: 'user', text: currentText, files: currentFiles, node: activeNode.name }]);
    setIsProcessing(true);
    setCommand("");
    setStagedFiles([]);

    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: currentText, nodePrompt: activeNode.prompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Execution Failed");
      setMessages(prev => [...prev, { role: 'ai', text: data.result, node: activeNode.name }]);
      setUserData(prev => ({ ...prev, usageCount: prev.usageCount + 1 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-silver flex overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;900&family=Inter:wght@300;400;500;600&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .bg-obsidian { background: #0C0C10; }
        .bg-graphite { background: #121218; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1B1B22; }
      `}</style>

      {/* VFX: Subdued Background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}><Suspense fallback={null}><NeuralEngine /></Suspense></Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' && (
           <motion.div key="l" exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#060608] flex items-center justify-center"><RefreshCw className="animate-spin text-crimson" /></motion.div>
        )}

        {view === 'auth' && (
          <div className="relative z-50 w-full flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-obsidian border border-white/5 p-12 rounded-2xl text-center shadow-2xl">
               <div className="flex justify-center mb-10"><ScorpioLogo size="lg" /></div>
               <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-4">
                <Globe size={18} className="text-crimson" /> Initialize Terminal
               </button>
            </div>
          </div>
        )}

        {view === 'dash' && (
          <div className="flex-1 flex relative z-10 w-full">
            {/* Sidebar: Enterprise Standard */}
            <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-obsidian border-r border-white/5 transition-all duration-300 flex flex-col`}>
               <div className="h-20 flex items-center px-6 border-b border-white/5"><ScorpioLogo collapsed={isSidebarCollapsed} /></div>
               <nav className="flex-1 p-4 space-y-2">
                  {[ { id: 'dash', name: 'Terminal', icon: <LayoutDashboard size={18}/> }, { id: 'history', name: 'Archives', icon: <History size={18}/> }].map(item => (
                    <div key={item.id} className="group flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <div className="text-gray-600 group-hover:text-crimson">{item.icon}</div>
                      {!isSidebarCollapsed && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.name}</span>}
                    </div>
                  ))}
               </nav>
               <div className="p-4 border-t border-white/5"><button onClick={() => signOut(auth)} className="w-full flex items-center gap-4 px-3 py-3 text-gray-500 hover:text-red-500 transition-colors"><Power size={18}/> {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase">Logout</span>}</button></div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 bg-[#060608]">
              <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-obsidian/50 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:text-white transition-colors"><ChevronLeft size={18} className={isSidebarCollapsed ? "rotate-180" : ""} /></button>
                    <h2 className="text-[10px] font-black uppercase tracking-[3px] text-white/30">{activeNode.name}</h2>
                 </div>
                 <div className="flex items-center gap-6"><Crown size={18} className={isPro ? "text-crimson" : "text-gray-800"} /></div>
              </header>

              <main className="flex-1 overflow-hidden flex flex-col relative">
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 scrollbar-hide">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-10"><ScorpioLogo size="lg" /></div>
                    ) : (
                      messages.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                           <div className={`max-w-[75%] p-6 rounded-2xl border ${m.role === 'ai' ? 'bg-graphite border-white/5 text-gray-300' : 'bg-crimson/5 border-crimson/20 text-white shadow-lg'}`}>
                              {m.files && m.files.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {m.files.map(f => <div key={f} className="flex items-center gap-2 p-1.5 bg-black/40 rounded-lg border border-white/5 text-[8px] font-black text-crimson uppercase"><FileText size={10}/> {f}</div>)}
                                </div>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                           </div>
                        </motion.div>
                      ))
                    )}
                    {isProcessing && <div className="flex justify-start animate-pulse"><div className="bg-graphite p-5 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-600">Processing...</div></div>}
                </div>

                {/* --- PRIME CONSOLE --- */}
                <div className="p-8 relative z-20">
                    <div className="max-w-4xl mx-auto relative">
                        {/* FILE PACKETS */}
                        <AnimatePresence>
                          {stagedFiles.length > 0 && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-full mb-4 left-0 flex flex-wrap gap-3">
                               {stagedFiles.map((f, i) => (
                                 <div key={i} className="p-3 bg-graphite border border-crimson/30 rounded-xl shadow-2xl flex items-center gap-4">
                                    <div className="p-1 bg-crimson/10 rounded-lg text-crimson"><Paperclip size={14}/></div>
                                    <span className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{f.name}</span>
                                    <button onClick={() => setStagedFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white"><X size={12}/></button>
                                 </div>
                               ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* NINJA TOOL HUD */}
                        <AnimatePresence>
                          {showTools && (
                            <motion.div 
                              onMouseEnter={() => setShowTools(true)} onMouseLeave={() => setShowTools(false)}
                              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }} 
                              className="absolute bottom-full mb-4 left-0 w-64 bg-obsidian border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-visible"
                            >
                               {NODES.map(node => (
                                 <div 
                                    key={node.id} 
                                    onMouseEnter={() => setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)}
                                    onClick={() => { setActiveNode(node); setShowTools(false); }} 
                                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeNode.id === node.id ? 'bg-crimson/10 text-white' : 'hover:bg-white/5 text-gray-600'}`}
                                 >
                                    <div className={activeNode.id === node.id ? 'text-crimson' : ''}>{node.icon}</div>
                                    <span className="text-[11px] font-black uppercase tracking-widest">{node.name}</span>
                                    
                                    {/* NODE DESCRIPTION TOOLTIP */}
                                    <AnimatePresence>
                                       {hoveredNodeId === node.id && (
                                          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-48 bg-graphite border border-white/10 p-3 rounded-xl shadow-2xl z-[60]">
                                             <p className="text-[9px] font-medium leading-tight text-gray-500 italic">"{node.desc}"</p>
                                          </motion.div>
                                       )}
                                    </AnimatePresence>
                                 </div>
                               ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="bg-obsidian border border-white/10 rounded-2xl shadow-2xl p-4 transition-all focus-within:border-crimson/40">
                            <textarea 
                               className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-gray-900 min-h-[90px]"
                               placeholder="Ask Scorpio..." value={command}
                               onChange={(e) => setCommand(e.target.value)}
                               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handleCommand(e); }}
                            />
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                               <div className="flex items-center gap-1.5">
                                  <input type="file" ref={fileInputRef} className="hidden" multiple={isPro} onChange={handleFileUpload} />
                                  <button onMouseEnter={() => setShowTools(true)} className="p-2.5 bg-graphite border border-white/5 rounded-xl hover:border-crimson/50 transition-all text-gray-600 hover:text-white shadow-inner"><Binary size={18} /></button>
                                  <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-gray-600 hover:text-crimson transition-colors"><Paperclip size={20} /></button>
                               </div>
                               <div className="flex items-center gap-6">
                                  <span className="text-[9px] font-black text-gray-800 uppercase tracking-widest">{userData.usageCount}/{isPro ? '∞' : '5'} CYCLES</span>
                                  <button onClick={handleCommand} disabled={isProcessing} className="bg-crimson hover:bg-red-700 px-6 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center gap-3 shadow-lg disabled:opacity-20">EXECUTE <Send size={14}/></button>
                               </div>
                            </div>
                        </div>
                    </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}