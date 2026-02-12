
import React, { useState, useEffect, useRef } from 'react';
import { User, AudioBlock, VoiceOption, ProjectState, ToneOption, VoiceCloneProfile } from './types';
import { CHARS_PER_BLOCK, VOICE_OPTIONS, TONE_OPTIONS } from './constants';
import { getSessionUser, logout, validateUser } from './services/authService';
import { generateAudio, playPreview, analyzeVoiceReference } from './services/voiceService';
import { slugify, isDomainAuthorized } from './utils/crypto';

const Icons = {
  Play: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  LogOut: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  Keys: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>,
  Science: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9.75 3.104v1.244c0 .285-.121.55-.333.738L3.92 9.48a2.25 2.25 0 0 0-.733 1.686v8.584c0 .414.336.75.75.75h16.126a.75.75 0 0 0 .75-.75v-8.584c0-.648-.28-1.264-.766-1.686l-5.464-4.394a1.125 1.125 0 0 1-.333-.738V3.104c0-.414-.336-.75-.75-.75H10.5a.75.75 0 0 0-.75.75z" /><path d="M15 3.75V2.25M9 3.75V2.25M12 3.75v12m0 0l-3-3m3 3l3-3" /></svg>,
  Upload: () => <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>,
  Star: () => <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  Minus: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M20 12H4"/></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  Mood: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isCatalogEditorOpen, setIsCatalogEditorOpen] = useState(false);
  const [integrityError, setIntegrityError] = useState(false);
  const [cloningStatus, setCloningStatus] = useState<'idle' | 'analyzing' | 'success'>('idle');
  const [catalog, setCatalog] = useState(VOICE_OPTIONS);
  const [isVipMode, setIsVipMode] = useState(false);

  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
    gemini1: '', gemini2: '', gemini3: '', universal: ''
  });

  const [apiKeysEnabled, setApiKeysEnabled] = useState<{ [key: string]: boolean }>({
    gemini1: true, gemini2: true, gemini3: true, universal: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<ProjectState>({
    title: '', script: '', voice: 'kore', tone: 'Neutral', isAutoDownload: false, blocks: [], isProcessing: false, activeCloneProfile: undefined
  });

  useEffect(() => {
    const savedKeys = localStorage.getItem('VOZPRO_API_KEYS');
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));
    const savedEnabled = localStorage.getItem('VOZPRO_API_ENABLED');
    if (savedEnabled) setApiKeysEnabled(JSON.parse(savedEnabled));
    const savedCatalog = localStorage.getItem('VOZPRO_CUSTOM_CATALOG');
    if (savedCatalog) setCatalog(JSON.parse(savedCatalog));

    if (!isDomainAuthorized()) { setIntegrityError(true); return; }
    const sessionUser = getSessionUser();
    if (sessionUser) setUser(sessionUser);
  }, []);

  const getAvailableKeys = (): string[] => {
    const validKeys: string[] = [];
    Object.keys(apiKeys).forEach(id => {
      if (apiKeysEnabled[id] && apiKeys[id]?.trim()) validKeys.push(apiKeys[id].trim());
    });
    if (validKeys.length === 0 && process.env.API_KEY) validKeys.push(process.env.API_KEY);
    return validKeys;
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleCloneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const keys = getAvailableKeys();
    if (!file || keys.length === 0) {
      alert("Configura al menos un Nodo API activo.");
      return;
    }
    
    setCloningStatus('analyzing');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        let analysis = "";
        let success = false;
        for (const k of keys) {
          try {
            analysis = await analyzeVoiceReference(base64, k);
            if (analysis) { success = true; break; }
          } catch (err: any) {
            if (err.message?.includes('429')) await delay(10000); // 10s para clonación
            continue;
          }
        }

        if (success) {
          setProject(p => ({
            ...p,
            activeCloneProfile: { id: `cl-${Date.now()}`, name: file.name.split('.')[0], description: "ADN clonado", analysisPrompt: analysis, isActive: true }
          }));
          setCloningStatus('success');
          setTimeout(() => setCloningStatus('idle'), 3000);
        } else {
          alert("Error de Cuota: Google rechazó la muestra por exceso de peticiones. Espera 60 segundos.");
          setCloningStatus('idle');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setCloningStatus('idle');
    }
  };

  const saveAndCloseEditor = () => {
    let currentCatalog = [...catalog];
    if (project.activeCloneProfile) {
      const g = prompt(`Género (M/F):`)?.toUpperCase() || 'M';
      const newV = {
        name: `custom-${Date.now()}`,
        label: project.activeCloneProfile.name,
        description: "Voz Clonada VIP",
        gender: g === 'F' ? 'F' : 'M',
        dna: project.activeCloneProfile.analysisPrompt
      } as any;
      currentCatalog = [newV, ...currentCatalog];
    }
    setCatalog(currentCatalog);
    localStorage.setItem('VOZPRO_CUSTOM_CATALOG', JSON.stringify(currentCatalog));
    setIsCatalogEditorOpen(false);
    setIsCloneModalOpen(false);
    alert("Voz añadida al catálogo.");
  };

  const handleTestVoice = async (voiceName: string) => {
    const keys = getAvailableKeys();
    if (keys.length === 0) return alert("Configura tus APIs.");
    try {
      const v = catalog.find(cv => cv.name === voiceName);
      const dna = (v as any)?.dna;
      const cloneProfile = dna ? { analysisPrompt: dna } as any : project.activeCloneProfile;
      await playPreview(voiceName, keys[0], project.tone, cloneProfile);
    } catch (e: any) {
      const is429 = e.message?.includes('429');
      alert(is429 ? "Cuota agotada. Espera 20 segundos para probar de nuevo." : "Error de conexión.");
    }
  };

  const processBlock = async (block: AudioBlock, keys: string[], voice: string, tone: ToneOption, cloneProfile: any): Promise<boolean> => {
    setProject(p => ({
      ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, status: 'processing', error: undefined } : b)
    }));

    let success = false;
    let errorMsg = "";

    for (const key of keys) {
      try {
        const blob = await generateAudio(block.text, voice, key, tone, cloneProfile);
        setProject(p => ({
          ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, status: 'completed', audioUrl: URL.createObjectURL(blob) } : b)
        }));
        success = true;
        break;
      } catch (err: any) {
        if (err.message?.includes('429')) {
          setProject(p => ({
            ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, error: '⚠️ BLOQUEO DE CUOTA (20s)...' } : b)
          }));
          // Pausa agresiva para que Google resetee el contador de la cuenta Free
          await delay(20000); 
        }
        errorMsg = err.message || "Error de red";
        continue;
      }
    }

    if (!success) {
      setProject(p => ({
        ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, status: 'failed', error: 'Fallo crítico: ' + errorMsg } : b)
      }));
    }
    return success;
  };

  const handleGenerateMaster = async () => {
    const keys = getAvailableKeys();
    if (project.blocks.length === 0) return alert("Divide el guion primero.");
    if (keys.length === 0) return alert("No hay APIs configuradas.");

    setProject(p => ({ ...p, isProcessing: true }));
    
    const voiceData = catalog.find(v => v.name === project.voice);
    const dna = (voiceData as any)?.dna;
    const cloneProfile = dna ? { analysisPrompt: dna } as any : project.activeCloneProfile;

    // PROCESAMIENTO SECUENCIAL ULTRA-CONSERVADOR PARA EVITAR 429
    const pendingBlocks = project.blocks.filter(b => b.status !== 'completed');
    
    for (const block of pendingBlocks) {
      const ok = await processBlock(block, keys, project.voice, project.tone, cloneProfile);
      if (ok) {
        // Pausa de cortesía de 3 segundos entre bloques para evitar ráfagas
        await delay(3000);
      } else {
        // Si falló, pausamos 10 segundos antes de intentar con el siguiente bloque
        await delay(10000);
      }
    }

    setProject(p => ({ ...p, isProcessing: false }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const res = await validateUser(loginEmail);
    if (res.success && res.user) setUser(res.user);
    else setAuthError(res.message);
    setIsAuthLoading(false);
  };

  const saveKeys = () => {
    localStorage.setItem('VOZPRO_API_KEYS', JSON.stringify(apiKeys));
    localStorage.setItem('VOZPRO_API_ENABLED', JSON.stringify(apiKeysEnabled));
    setIsApiModalOpen(false);
    alert("Nodos sincronizados y listos.");
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] px-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 relative">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">VozPro</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Unidad de Audio IA</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" required placeholder="Email autorizado" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          {authError && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{authError}</div>}
          <button type="submit" disabled={isAuthLoading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs">
            {isAuthLoading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-40">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 h-24 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20"><span className="text-white font-black text-3xl">V</span></div>
          <span className="text-3xl font-black text-slate-900 italic tracking-tighter">VozPro <span className="text-blue-600">300%</span></span>
          <div className="flex gap-2">
            <button onClick={() => setIsApiModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase"><Icons.Keys /> APIs</button>
            <button onClick={() => setIsCloneModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${project.activeCloneProfile ? 'bg-green-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-700'}`}><Icons.Science /> {project.activeCloneProfile ? 'ADN Activo' : 'Clonar'}</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => { const c = prompt("Acceso VIP:"); if(c==="7384") setIsVipMode(!isVipMode); }} className={`p-3 rounded-xl transition-all ${isVipMode ? 'bg-yellow-400' : 'bg-slate-100 text-slate-300'}`}><Icons.Lock /></button>
           <button onClick={() => { logout(); setUser(null); }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Icons.LogOut /></button>
        </div>
      </header>

      {/* MODAL APIs */}
      {isApiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
               <h2 className="text-xl font-black italic">Gestión de Nodos API</h2>
               <button onClick={() => setIsApiModalOpen(false)} className="text-slate-400 hover:text-red-500"><Icons.LogOut /></button>
            </div>
            <div className="p-8 space-y-4">
               {['gemini1', 'gemini2', 'gemini3', 'universal'].map(id => (
                 <div key={id} className="flex gap-2">
                    <input type="password" value={apiKeys[id]} onChange={e => setApiKeys({...apiKeys, [id]: e.target.value})} className="flex-1 p-4 rounded-2xl border border-slate-200 text-xs shadow-inner focus:border-blue-500 outline-none" placeholder={`Llave API ${id}`} />
                    <button onClick={() => setApiKeysEnabled({...apiKeysEnabled, [id]: !apiKeysEnabled[id]})} className={`px-4 rounded-2xl text-[9px] font-black transition-all ${apiKeysEnabled[id] ? 'bg-green-500 text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}>{apiKeysEnabled[id] ? 'ON' : 'OFF'}</button>
                 </div>
               ))}
               <p className="text-[9px] text-slate-400 italic">💡 Sugerencia: Usa varias llaves para que el sistema rote si una alcanza el límite.</p>
               <button onClick={saveKeys} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase mt-4">Sincronizar Nodos</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CLONACIÓN */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-10 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black italic">Extracción de ADN Vocal</h2>
              <button onClick={() => setIsCloneModalOpen(false)}><Icons.LogOut /></button>
            </div>
            <div className="p-10 space-y-8">
              <div className={`border-4 border-dashed rounded-[3rem] p-12 text-center cursor-pointer transition-all ${cloningStatus === 'analyzing' ? 'animate-pulse bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-100 hover:border-blue-400'}`} onClick={() => fileInputRef.current?.click()}>
                <input type="file" accept="audio/*" className="hidden" ref={fileInputRef} onChange={handleCloneUpload} />
                {cloningStatus === 'analyzing' ? <p className="font-black text-blue-600">ANALIZANDO FRECUENCIAS...</p> : 
                 project.activeCloneProfile ? <div className="flex flex-col items-center gap-4"><Icons.Check /><p className="font-black text-green-600 uppercase">ADN CAPTURADO</p></div> :
                 <div className="flex flex-col items-center"><Icons.Upload /><p className="mt-4 font-black">SUBIR AUDIO DE REFERENCIA</p></div>}
              </div>
              {project.activeCloneProfile && (
                <button onClick={() => setIsCatalogEditorOpen(true)} className="w-full py-6 bg-yellow-400 rounded-[2rem] font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all">AÑADIR A CATÁLOGO VIP</button>
              )}
              {isCatalogEditorOpen && (
                <div className="pt-4 border-t space-y-4">
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400">Confirmar Guardado</p>
                   <button onClick={saveAndCloseEditor} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase">Guardar en mi Catálogo</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-10 py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
           <h2 className="text-3xl font-black italic mb-10 border-l-8 border-blue-600 pl-6">Producción Maestra</h2>
           <div className="space-y-6">
              <input type="text" value={project.title} onChange={e => setProject({...project, title: e.target.value})} className="w-full p-6 bg-slate-50 rounded-3xl text-xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Título de la producción..." />
              <textarea value={project.script} onChange={e => setProject({...project, script: e.target.value})} className="w-full h-[40rem] p-10 bg-slate-50 rounded-[3rem] text-lg outline-none resize-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all leading-relaxed custom-scrollbar" placeholder="Escribe tu guion aquí..." />
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xl italic flex items-center gap-2"><Icons.Mood /> Parámetros</h3>
                {project.isProcessing && <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-8 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                {TONE_OPTIONS.map(t => (
                  <button key={t.name} onClick={() => setProject({...project, tone: t.name})} className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${project.tone === t.name ? 'border-blue-500 bg-blue-50' : 'border-slate-50 hover:bg-slate-100'}`}>
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-[8px] font-black uppercase mt-1 text-center">{t.name}</span>
                  </button>
                ))}
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar mb-8 pr-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Catálogo de Voces</p>
                 {catalog.map(v => (
                   <div key={v.name} className={`flex items-center justify-between p-3 border-2 rounded-2xl mb-2 transition-all ${project.voice === v.name ? 'border-blue-500 bg-blue-50' : 'border-slate-50'}`}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input type="radio" checked={project.voice === v.name} onChange={() => setProject({...project, voice: v.name})} className="hidden" />
                        <div className={`w-3 h-3 rounded-full ${v.gender === 'M' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black">{v.label}</span>
                          <span className="text-[8px] text-slate-400 uppercase italic">{v.description}</span>
                        </div>
                      </label>
                      <button onClick={() => handleTestVoice(v.name)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Icons.Play /></button>
                   </div>
                 ))}
              </div>
              <button onClick={() => {
                if(!project.script || !project.title) return alert("Falta guion o título.");
                const blocks = [];
                let i = 0;
                while(i < project.script.length) {
                  const end = i + CHARS_PER_BLOCK;
                  blocks.push({ id: `b-${blocks.length}`, text: project.script.substring(i, end), filename: `${slugify(project.title)}-${blocks.length+1}.mp3`, status: 'pending' });
                  i = end;
                }
                setProject({...project, blocks});
                alert(`${blocks.length} bloques segmentados.`);
              }} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs mb-3 shadow-lg">Dividir Guion</button>
              <button onClick={handleGenerateMaster} disabled={project.isProcessing} className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs shadow-2xl hover:bg-blue-700 transition-all disabled:bg-slate-200">
                {project.isProcessing ? '⚙️ PROCESANDO (COOLDOWN ACTIVO)' : '🚀 GENERAR MASTER MP3'}
              </button>
              <p className="text-[8px] text-slate-400 text-center mt-4 italic uppercase">El sistema incluye pausas automáticas para evitar bloqueos de Google.</p>
           </div>
        </div>
        
        {project.blocks.length > 0 && (
          <div className="col-span-12 mt-20">
             <h2 className="text-4xl font-black italic mb-12 text-slate-800">Archivos Generados</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {project.blocks.map(b => (
                  <div key={b.id} className={`p-8 bg-white border-2 rounded-[3.5rem] shadow-sm flex flex-col justify-between transition-all hover:shadow-xl ${b.status === 'completed' ? 'border-green-100' : 'border-slate-50'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full ${b.status === 'completed' ? 'bg-green-100 text-green-600' : b.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                          {b.status === 'completed' ? 'AUDIO LISTO' : b.status === 'processing' ? (b.error ? 'PAUSA DE CUOTA' : 'PROCESANDO') : b.status === 'failed' ? 'ERROR CRÍTICO' : 'PENDIENTE'}
                        </span>
                        {b.status === 'completed' && <Icons.Star />}
                      </div>
                      <p className="font-black text-slate-700 truncate mb-8 text-sm">{b.filename}</p>
                      <div className="flex gap-3">
                        {b.audioUrl ? (
                          <>
                            <button onClick={() => new Audio(b.audioUrl).play()} className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-700 transition-all">ESCUCHAR</button>
                            <a href={b.audioUrl} download={b.filename} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase text-center flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
                              <Icons.Download /> DESCARGAR
                            </a>
                          </>
                        ) : (
                          <div className={`w-full py-5 rounded-3xl text-[10px] font-black text-center italic ${b.error ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-300'}`}>
                            {b.status === 'processing' ? (b.error ? 'RECUPERANDO...' : 'TRABAJANDO...') : 'EN COLA'}
                          </div>
                        )}
                      </div>
                      {b.error && <p className="text-[9px] text-orange-600 mt-3 font-bold text-center italic leading-tight uppercase">{b.error}</p>}
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
