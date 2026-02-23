import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, History, Settings, X, Trash2, Crown, Globe, ShieldCheck, 
  Cpu, Menu, CheckCircle2, Microscope, Activity, Binary, RefreshCw, Power, 
  ShieldAlert, Gavel, Truck, Search, Briefcase, UserCircle, CreditCard, Sparkles,
  LayoutDashboard, Database, ChevronLeft, ChevronRight, FileUp, FileText, Paperclip
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
const appId = "scorpio-enterprise-v4";

const NODES = [
  { id: 'n1', name: "Science Audit", icon: <Microscope size={14}/>, prompt: "Bio-Regulatory Auditor mode." },
  { id: 'n2', name: "Legal Log", icon: <Gavel size={14}/>, prompt: "Patent Lawyer mode." },
  { id: 'n3', name: "NAMs Report", icon: <ShieldAlert size={14}/>, prompt: "FDA Specialist mode." },
  { id: 'n4', name: "Supply Chain", icon: <Truck size={14}/>, prompt: "Logistics Expert mode." },
  { id: 'n5', name: "IP Hunter", icon: <Search size={14}/>, prompt: "IP Strategist mode." },
  { id: 'n6', name: "Patent Cliff", icon: <Briefcase size={14}/>, prompt: "Consultant mode." }
];

// --- LOGO COMPONENT ---
const ScorpioLogo = ({ size = "sm", collapsed = false }) => (
  <div className="flex items-center gap-2 select-none">
    <div className={`${size === "sm" ? "w-7 h-7" : "w-10 h-10"} flex items-center justify-center bg-crimson/10 rounded-lg border border-crimson/30`}>
      <Binary className="text-crimson" size={size === "sm" ? 14 : 20} />
    </div>
    {!collapsed && <span className={`font-orbitron font-black tracking-[2px] text-white ${size === "sm" ? "text-sm" : "text-xl"}`}>SCORPIO</span>}
  </div>
);

// --- 3D ENGINE ---
const NeuralEngine = () => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(3000), { radius: 5.5 }), []);
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta/40; ref.current.rotation.y -= delta/45; } });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8B1116" size={0.015} sizeAttenuation depthWrite={false} opacity={0.4} />
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNodesPopup, setShowNodesPopup] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setAttachedFile(file);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() && !attachedFile || isProcessing) return;

    const currentText = command;
    const currentFile = attachedFile;

    setMessages(prev => [...prev, { role: 'user', text: currentText, file: currentFile?.name, node: activeNode.name }]);
    setIsProcessing(true);
    setCommand("");
    setAttachedFile(null);

    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: currentText, nodePrompt: activeNode.prompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.result, node: activeNode.name }]);
      setUserData(prev => ({ ...prev, usageCount: prev.usageCount + 1 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-silver flex overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@300;400;500;600&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .bg-obsidian { background: #0E0E12; }
        .bg-graphite { background: #15151A; }
        .text-crimson { color: #8B1116; }
        .bg-crimson { background: #8B1116; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1B1B22; }
      `}</style>

      {/* VFX Layer */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}><NeuralEngine /></Suspense>
        </Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' && (
           <motion.div key="l" exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#08080A] flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-t-2 border-crimson rounded-full animate-spin mb-4" />
           </motion.div>
        )}

        {view === 'auth' && (
          <div className="relative z-50 w-full flex items-center justify-center">
            <div className="w-full max-w-md bg-obsidian border border-white/5 p-12 rounded-2xl text-center shadow-2xl">
               <div className="flex justify-center mb-10"><ScorpioLogo size="lg" /></div>
               <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-4">
                <Globe size={18} className="text-crimson" /> Initialize Identity
               </button>
            </div>
          </div>
        )}

        {view === 'dash' && (
          <div className="flex-1 flex relative z-10 w-full">
            {/* --- COMPACT SIDEBAR --- */}
            <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-obsidian border-r border-white/5 transition-all duration-300 flex flex-col`}>
               <div className="h-20 flex items-center px-6 border-b border-white/5">
                  <ScorpioLogo collapsed={isSidebarCollapsed} />
               </div>
               <nav className="flex-1 p-4 space-y-2">
                  {[
                    { id: 'dash', name: 'Terminal', icon: <LayoutDashboard size={18}/> },
                    { id: 'history', name: 'Archives', icon: <History size={18}/> },
                    { id: 'settings', name: 'Settings', icon: <Settings size={18}/> }
                  ].map(item => (
                    <div key={item.id} className="group flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <div className="text-gray-500 group-hover:text-crimson">{item.icon}</div>
                      {!isSidebarCollapsed && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.name}</span>}
                    </div>
                  ))}
               </nav>
               <div className="p-4 border-t border-white/5">
                  <button onClick={() => signOut(auth)} className="w-full flex items-center gap-4 px-3 py-3 text-gray-500 hover:text-red-500 transition-colors">
                    <Power size={18}/> {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
                  </button>
               </div>
            </aside>

            {/* --- WORKSTATION --- */}
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-obsidian/50 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:text-white transition-colors">
                        <Menu size={20} />
                    </button>
                    <h2 className="text-sm font-black uppercase tracking-[2px] text-white/50">{activeNode.name}</h2>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-[9px] font-bold text-gray-600 uppercase bg-white/5 px-2 py-1 rounded">2026.UPLINK</span>
                 </div>
              </header>

              <main className="flex-1 overflow-hidden flex flex-col relative">
                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 scrollbar-hide">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-10">
                         <ScorpioLogo size="lg" />
                         <p className="font-orbitron text-[10px] tracking-[10px] uppercase mt-6">Standby</p>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                           <div className={`max-w-[75%] p-6 rounded-2xl border ${m.role === 'ai' ? 'bg-graphite border-white/5' : 'bg-crimson/10 border-crimson/20'}`}>
                              {m.file && (
                                <div className="flex items-center gap-2 mb-3 p-2 bg-black/40 rounded-lg border border-white/5 text-[10px] font-bold text-crimson">
                                   <FileText size={12}/> {m.file}
                                </div>
                              )}
                              <p className={`text-sm leading-relaxed ${m.role === 'ai' ? 'text-gray-300' : 'text-white'}`}>{m.text}</p>
                           </div>
                        </motion.div>
                      ))
                    )}
                    {isProcessing && <div className="flex justify-start"><div className="bg-graphite p-6 rounded-2xl border border-white/5 flex items-center gap-3"><RefreshCw className="animate-spin text-crimson" size={14}/><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Processing...</span></div></div>}
                </div>

                {/* --- NINJA CONSOLE --- */}
                <div className="p-8 relative z-20">
                    <div className="max-w-4xl mx-auto relative">
                        
                        {/* ATTACHMENT POPUP */}
                        <AnimatePresence>
                          {attachedFile && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-full mb-4 left-0 p-3 bg-graphite border border-crimson/30 rounded-xl shadow-2xl flex items-center gap-4">
                               <div className="p-2 bg-crimson/10 rounded-lg text-crimson"><FileUp size={16}/></div>
                               <div className="flex-1 pr-4">
                                  <p className="text-[10px] font-bold text-white uppercase">{attachedFile.name}</p>
                                  <p className="text-[8px] text-gray-500">{(attachedFile.size/1024).toFixed(1)} KB READY</p>
                               </div>
                               <button onClick={() => setAttachedFile(null)} className="hover:text-white"><X size={14}/></button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* NINJA NODE POPUP (On Hover) */}
                        <AnimatePresence>
                          {showNodesPopup && (
                            <motion.div 
                              onMouseEnter={() => setShowNodesPopup(true)}
                              onMouseLeave={() => setShowNodesPopup(false)}
                              initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} 
                              className="absolute bottom-full mb-4 left-0 w-56 bg-obsidian border border-white/10 rounded-2xl shadow-2xl p-2 overflow-hidden"
                            >
                               <div className="px-3 py-2 border-b border-white/5 mb-1">
                                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Active Tools</p>
                               </div>
                               {NODES.map(node => (
                                 <div key={node.id} onClick={() => { setActiveNode(node); setShowNodesPopup(false); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeNode.id === node.id ? 'bg-crimson/10 text-white' : 'hover:bg-white/5 text-gray-500'}`}>
                                    <div className={activeNode.id === node.id ? 'text-crimson' : ''}>{node.icon}</div>
                                    <span className="text-[11px] font-medium">{node.name}</span>
                                 </div>
                               ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* MAIN COMMAND CARD */}
                        <div className="bg-obsidian border border-white/10 rounded-2xl shadow-2xl p-4 transition-all focus-within:border-crimson/40">
                            <textarea 
                               className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-gray-800 min-h-[80px]"
                               placeholder={`Input protocol for ${activeNode.name}...`}
                               value={command}
                               onChange={(e) => setCommand(e.target.value)}
                               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handleCommand(e); }}
                            />
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                               <div className="flex items-center gap-1">
                                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                  <button 
                                    onMouseEnter={() => setShowNodesPopup(true)}
                                    className="p-2.5 bg-graphite border border-white/5 rounded-xl hover:border-crimson/50 transition-all text-gray-500 hover:text-white"
                                  >
                                     <ScorpioLogo size="sm" collapsed={true} />
                                  </button>
                                  <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-gray-600 hover:text-crimson transition-colors">
                                     <Paperclip size={18} />
                                  </button>
                               </div>
                               <div className="flex items-center gap-6">
                                  <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">{userData.usageCount}/5 CYCLES</span>
                                  <button onClick={handleCommand} disabled={isProcessing || (!command.trim() && !attachedFile)} className="bg-crimson hover:bg-red-700 px-5 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-3 shadow-lg disabled:opacity-20">
                                     EXECUTE <Send size={12}/>
                                  </button>
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