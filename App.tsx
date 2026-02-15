
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { 
  Waves, MapPin, RefreshCw, Home, History as HistoryIcon
} from 'lucide-react';
import { TideChart } from './components/TideChart';
import { StatusCard } from './components/StatusCard';
import { HistorySection } from './components/HistorySection';
import { TimelineOverlay } from './components/TimelineOverlay';
import { analyzeRisk } from './services/geminiService';
import { RiskAnalysis, FloodHistory, RiskZone } from './types';

const InteractiveMap = lazy(() => import('./components/InteractiveMap').then(m => ({ default: m.InteractiveMap })));

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-3xl ${className}`} />
);

const App: React.FC = () => {
  // Inicializa o estado buscando imediatamente do localStorage para evitar telas de loading
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(() => {
    try {
      const saved = localStorage.getItem('risk_analysis_recife_v2');
      return saved ? JSON.parse(saved).data : null;
    } catch { return null; }
  });
  
  const [loading, setLoading] = useState(!analysis); // Só é loading real se não tiver cache
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'history'>('home');
  const [selectedItem, setSelectedItem] = useState<FloodHistory | RiskZone | null>(null);

  const loadData = useCallback(async (force: boolean = false) => {
    if (analysis) setSyncing(true);
    else setLoading(true);

    try {
      // O analyzeRisk já lida com o onCacheLoaded internamente, 
      // mas como já inicializamos o state com o cache, aqui ele só busca o novo.
      const result = await analyzeRisk(force);
      setAnalysis(result);
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [analysis]);

  useEffect(() => {
    loadData();
  }, []);

  // Memoniza componentes pesados para evitar re-calculo do Recharts sem necessidade
  const homeContent = useMemo(() => (
    <div className="space-y-4 animate-in fade-in duration-300">
      <StatusCard analysis={analysis} loading={false} />
      <TimelineOverlay events={analysis?.timeline || []} />
      <TideChart data={analysis?.liveTides || []} />
    </div>
  ), [analysis]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-blue-100">
      {/* Barra de Sincronização Minimalista */}
      {(syncing || loading) && (
        <div className="fixed top-0 inset-x-0 z-[100] h-1 bg-blue-600/5 overflow-hidden">
          <div className="h-full bg-blue-600 w-1/4 animate-[loading_1.5s_infinite_ease-in-out]"></div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Waves size={18} strokeWidth={3} />
            </div>
            <h1 className="text-xl font-black dark:text-white tracking-tight italic">RECIFE<span className="text-blue-600">ALERTA</span></h1>
          </div>
          <button 
            disabled={syncing}
            onClick={() => loadData(true)} 
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full active:scale-90 transition-transform"
          >
            <RefreshCw size={18} className={`${syncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 pt-4 pb-28 space-y-4">
        {loading && !analysis ? (
          <div className="space-y-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <>
            {activeTab === 'home' && homeContent}

            {activeTab === 'map' && (
              <div className="fixed inset-0 top-[64px] z-40 bg-slate-100 dark:bg-slate-900">
                <Suspense fallback={
                  <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Iniciando Mapas...</span>
                  </div>
                }>
                  <InteractiveMap 
                    history={analysis?.history || []} 
                    riskZones={analysis?.riskZones || []} 
                    onSelectEvent={setSelectedItem} 
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-in slide-in-from-right duration-300">
                <HistorySection history={analysis?.history || []} />
              </div>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 px-10 py-4 flex justify-between items-center z-[70] pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {[
          { id: 'home', icon: Home, label: 'Resumo' },
          { id: 'map', icon: MapPin, label: 'Zonas' },
          { id: 'history', icon: HistoryIcon, label: 'Registros' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes loading { 
          0% { transform: translateX(-100%); width: 10%; } 
          50% { width: 40%; }
          100% { transform: translateX(400%); width: 10%; } 
        }
      `}</style>
    </div>
  );
};

export default App;
