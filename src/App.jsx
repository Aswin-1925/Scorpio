import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, MeshDistortMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, doc, collection, onSnapshot, 
  addDoc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Send, History, Settings, X, Pin, Trash2, Share2, 
  Crown, Mail, Globe, ShieldCheck, Cpu, Terminal, 
  ChevronRight, ExternalLink, AlertOctagon, Zap, 
  Menu, User, CheckCircle2, Laptop, Smartphone, Tablet,
  FlaskConical, Scale, Factory, Microscope, Lock, Activity, Binary, 
  Search, Eye, MapPin, Download, RefreshCw, FileText
} from 'lucide-react';

// --- SYSTEM CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB0as5wtNMh_D472nJPFxa_eBdEgDacI60",
  authDomain: "scropio-89341.firebaseapp.com",
  projectId: "scropio-89341",
  storageBucket: "scropio-89341.firebasestorage.app",
  messagingSenderId: "344477970541",
  appId: "1:344477970541:web:98a853d3ae4ea4070d0f64"
};

// Safety Check for Firebase Init
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "scorpio-89341-apex";

// --- 3D NEURAL VISUALS ---

const Particles = () => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 6 }), []);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20;
      ref.current.rotation.y -= delta / 25;
    }
  });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8B1116" size={0.02} sizeAttenuation depthWrite={false} opacity={0.5} />
      </Points>
    </group>
  );
};

const NeuralCore = () => {
  const mesh = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.3;
      mesh.current.rotation.z = t * 0.1;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.6, 64, 64]} />
        <MeshDistortMaterial color="#050506" distort={0.4} speed={1.5} roughness={0.1} metalness={1} emissive="#8B1116" emissiveIntensity={0.5} />
      </mesh>
    </Float>
  );
};

// --- APP UI ---

export default function App() {
  const [view, setView] = useState('loading'); // loading | auth | dash
  const [user, setUser] = useState(null);
  const [command, setCommand] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("AUTH_STATE:", u ? "CONNECTED" : "DISCONNECTED");
      setUser(u);
      if (u) setView('dash');
      else setView('auth');
    });

    // If still loading after 4 seconds, show the override button
    const timer = setTimeout(() => setShowOverride(true), 4000);
    
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Sync History
  useEffect(() => {
    if (!user || view !== 'dash') return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data.sort((a, b) => b.timestamp - a.timestamp));
    });
  }, [user, view]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      setError("Handshake blocked. Please whitelist localhost in Firebase Console.");
    }
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user?.uid || 'local-user', 'history'), {
        text: command,
        timestamp: Date.now(),
        node: `NODE_${Math.floor(Math.random()*999)}`
      });
      setCommand("");
    } catch (e) { console.error(e); }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-silver font-sans overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;500;700&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .glass-panel { background: rgba(13, 13, 18, 0.9); backdrop-filter: blur(40px); border: 1px solid rgba(139, 17, 22, 0.2); }
        .glass-card { background: rgba(20, 20, 25, 0.9); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.04); }
        .crimson-glow { box-shadow: 0 0 50px rgba(139, 17, 22, 0.4); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #8B1116; border-radius: 10px; }
      `}</style>

      {/* 3D CORE */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none bg-[#050506]">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#8B1116" />
          <Suspense fallback={null}>
            <NeuralCore />
            <Particles />
          </Suspense>
        </Canvas>
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW: LOADING / OVERRIDE */}
        {view === 'loading' && (
          <motion.div key="l" className="fixed inset-0 z-[200] bg-[#050506] flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-t-2 border-crimson rounded-full animate-spin mb-6" />
             <p className="font-orbitron text-[10px] font-black tracking-[8px] text-crimson animate-pulse uppercase mb-8">Syncing Node...</p>
             {showOverride && (
               <button onClick={() => setView('auth')} className="px-6 py-2 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                 [ Force Manual Entry ]
               </button>
             )}
          </motion.div>
        )}

        {/* VIEW: AUTHENTICATION */}
        {view === 'auth' && (
          <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-50 min-h-screen flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-xl glass-panel p-12 md:p-20 rounded-[5rem] text-center crimson-glow border-white/5">
              <div className="font-orbitron text-4xl font-black tracking-[12px] text-[#8B1116] uppercase mb-6 italic">Scorpio</div>
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-600 mb-14">Neural Identity Gate</p>
              
              <button onClick={handleGoogleLogin} className="w-full py-6 glass-card border-white/5 hover:bg-white/5 text-silver font-black uppercase tracking-widest text-[11px] rounded-3xl transition-all flex items-center justify-center gap-5 mb-10 shadow-xl">
                <Globe size={18} className="text-crimson" /> Google Identity Node
              </button>

              <button onClick={() => setView('dash')} className="text-[9px] font-bold text-gray-700 uppercase tracking-widest hover:text-crimson transition-colors">
                [ Enter in Local Test Mode ]
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW: DASHBOARD */}
        {view === 'dash' && (
          <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex h-screen p-4 md:p-8 gap-8 overflow-hidden">
            <aside className="hidden lg:flex w-28 glass-panel rounded-[4.5rem] flex-col items-center py-16 gap-14 border-white/5">
               <div className="font-orbitron text-[11px] font-black text-white italic -rotate-90 py-12 tracking-[10px]">SCORPIO</div>
               <div className="flex flex-col gap-14 text-gray-600 mt-8">
                  <Microscope size={28} className="hover:text-crimson cursor-pointer transition-colors" />
                  <Scale size={28} className="hover:text-crimson cursor-pointer transition-colors" onClick={() => setIsSubscriptionOpen(true)} />
                  <Settings size={28} className="hover:text-white cursor-pointer transition-colors" onClick={() => setIsSidebarOpen(true)} />
                  <Mail size={28} className="hover:text-crimson cursor-pointer transition-colors" onClick={() => setIsContactOpen(true)} />
               </div>
               <button onClick={() => { signOut(auth); setView('auth'); }} className="mt-auto text-crimson opacity-40 hover:opacity-100 transition-all"><Power size={36} /></button>
            </aside>

            <main className="flex-1 flex flex-col gap-8 overflow-hidden">
              <header className="h-28 glass-panel rounded-[3.5rem] flex items-center justify-between px-16 border-white/5">
                <div className="flex items-center gap-12">
                  <Menu size={28} className="lg:hidden text-white" onClick={() => setIsSidebarOpen(true)} />
                  <div className="font-orbitron text-2xl font-black tracking-[8px] text-crimson uppercase italic select-none">Scorpio</div>
                </div>
                <div className="px-6 py-2 bg-crimson/10 border border-crimson/20 rounded-full flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-crimson rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-crimson uppercase">Node_{user?.uid.substring(0,4) || "Local"}</span>
                </div>
              </header>

              <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                <section className="col-span-12 lg:col-span-8 flex flex-col gap-8 overflow-hidden">
                  <div className="flex-1 glass-panel rounded-[5rem] p-12 md:p-20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 text-[20rem] font-black text-white/[0.02] italic select-none pointer-events-none font-orbitron">SWARM</div>
                    <div className="relative z-10 h-full flex flex-col">
                      <textarea placeholder="Hey, enter your neural command here..." value={command} onChange={e => setCommand(e.target.value)}
                        className="w-full h-full bg-transparent border-none outline-none text-4xl md:text-7xl font-light text-white placeholder:text-gray-900 resize-none scrollbar-hide"
                      />
                      <div className="mt-auto pt-10 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-8 bg-black/50 border border-white/5 p-5 rounded-[4rem] w-full max-w-3xl relative shadow-2xl focus-within:border-crimson/40 transition-all">
                           <button type="button" className="p-5 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 transition-colors" onClick={() => setCommand("Initialize tool: ")}><Plus size={32} /></button>
                           <div className="flex-1 text-[12px] font-black text-gray-800 uppercase tracking-widest pl-4 hidden sm:block">Awaiting input...</div>
                           <button onClick={handleCommand} disabled={isProcessing} className={`p-8 bg-[#8B1116] text-white rounded-full shadow-2xl transition-all ${isProcessing ? 'animate-pulse' : 'hover:scale-110 active:scale-90'}`}>
                              {isProcessing ? <RefreshCw className="animate-spin" size={32} /> : <Send size={32} />}
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="col-span-12 lg:col-span-4 flex flex-col gap-8 overflow-hidden">
                   <div className="flex-1 glass-panel rounded-[4.5rem] p-12 overflow-y-auto scrollbar-hide">
                      <h3 className="text-[11px] font-black uppercase tracking-[8px] text-gray-600 mb-12 flex items-center gap-5 font-orbitron"><History size={20} /> Archive</h3>
                      <div className="space-y-6">
                         {history.map(item => (
                           <div key={item.id} className="p-6 glass-card rounded-3xl group border border-white/5 hover:border-crimson/30 transition-all">
                              <p className="text-[12px] text-silver/70 italic leading-relaxed">"{item.text}"</p>
                              <div className="mt-4 flex justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                                 <span className="text-[9px] font-black uppercase tracking-tighter">{item.node}</span>
                                 <Trash2 size={14} className="cursor-pointer hover:text-red-500" onClick={() => deleteItem(item.id)} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </section>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAYS */}
      <AnimatePresence>
        {isSubscriptionOpen && <SubscriptionModal onClose={() => setIsSubscriptionOpen(false)} />}
        {isContactOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <div className="w-full max-w-xl glass-panel p-16 rounded-[4rem] relative text-center">
                <button onClick={() => setIsContactOpen(false)} className="absolute top-10 right-10 text-white/20"><X size={32}/></button>
                <Mail className="text-crimson mx-auto mb-8" size={60} />
                <h2 className="font-orbitron text-2xl font-black text-white uppercase tracking-[8px] mb-4">Neural Uplink</h2>
                <p className="text-silver font-mono text-sm tracking-wide">scorpioai.lab@gmail.com</p>
             </div>
          </motion.div>
        )}
        
        {error && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed bottom-12 right-12 z-[300] glass-card border-l-4 border-crimson p-10 flex items-center gap-8 shadow-2xl">
            <AlertOctagon className="text-crimson" size={32} />
            <div>
               <p className="text-[11px] font-black uppercase tracking-[4px] text-white">System Protocol Blocked</p>
               <p className="text-[11px] font-bold text-gray-600 uppercase mt-2">{error}</p>
            </div>
            <X size={20} className="ml-10 cursor-pointer opacity-30" onClick={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 py-10 px-[10%] border-t border-white/5 flex flex-col md:flex-row justify-between items-center bg-black/40">
         <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest italic leading-relaxed text-center">
           © {new Date().getFullYear()} SCORPIO SINGULARITY. NEURAL RIGHTS SECURED.
         </span>
      </footer>
    </div>
  );
}

// Sub-components as icons or helper UI
const SubscriptionModal = ({ onClose }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
      <div className="w-full max-w-6xl glass-panel p-16 rounded-[5rem] relative border-white/5">
        <button onClick={onClose} className="absolute top-10 right-10 text-white/20 hover:text-white"><X size={32}/></button>
        <div className="text-center mb-16 font-orbitron">
          <h2 className="text-4xl font-black tracking-[10px] text-white uppercase italic">Command Tiers</h2>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] mt-4">Elevate Authorization</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5 text-center">
              <Microscope className="mx-auto mb-6 text-gray-500" size={40} />
              <h3 className="font-orbitron text-xl font-black text-white">GHOST</h3>
              <p className="text-4xl font-black my-6">$0</p>
              <button className="w-full py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase">Standard Node</button>
           </div>
           <div className="p-12 bg-crimson/10 rounded-[3rem] border border-crimson text-center crimson-glow scale-105">
              <Scale className="mx-auto mb-6 text-crimson" size={40} />
              <h3 className="font-orbitron text-xl font-black text-white">SPECTRE</h3>
              <p className="text-4xl font-black my-6">$24</p>
              <button className="w-full py-5 bg-crimson rounded-2xl text-[10px] font-black uppercase">Activate Spectre</button>
           </div>
           <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5 text-center">
              <Factory className="mx-auto mb-6 text-gray-500" size={40} />
              <h3 className="font-orbitron text-xl font-black text-white">SINGULARITY</h3>
              <p className="text-4xl font-black my-6">$99</p>
              <button className="w-full py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase">Enterprise Node</button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};