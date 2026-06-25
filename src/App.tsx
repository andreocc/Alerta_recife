import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import {
  Waves, MapPin, RefreshCw, Home, History as HistoryIcon, WifiOff, Clock, ExternalLink
} from 'lucide-react';
import { TideChart } from './components/TideChart';
import { StatusCard } from './components/StatusCard';
import { HistorySection } from './components/HistorySection';
import { TimelineOverlay } from './components/TimelineOverlay';
import { AlertBanner } from './components/AlertBanner';
import { analyzeRisk } from './services/riskEngine';
import { cleanupOldAlerts } from './services/notificationService';
import { RiskAnalysis, FloodHistory, RiskZone } from './types';

const InteractiveMap = lazy(() => import('./components/InteractiveMap').then(m => ({ default: m.InteractiveMap })));

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-3xl ${className}`} />
);

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(() => {
    try {
      const saved = localStorage.getItem('risk_analysis_recife_v6');
      return saved ? JSON.parse(saved).data : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(!analysis);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'history'>('home');
  const [selectedItem, setSelectedItem] = useState<FloodHistory | RiskZone | null>(null);

  // Limpa alertas antigos na montagem
  useEffect(() => {
    cleanupOldAlerts();
  }, []);

  const loadData = useCallback(async (force: boolean = false) => {
    setError(null);
    if (analysis) setSyncing(true);
    else setLoading(true);

    try {
      const result = await analyzeRisk({ forceRefresh: force });
      setAnalysis(result);
    } catch (err: any) {
      console.error('[App] Erro ao carregar análise:', err);

      let userMessage = 'Erro desconhecido. Tente novamente.';
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        userMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (err.message?.includes('timeout')) {
        userMessage = 'Tempo de conexão esgotado. Verifique sua internet.';
      } else if (err.message) {
        userMessage = err.message;
      }

      setError(userMessage);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [analysis]);

  useEffect(() => {
    loadData();
  }, []);

  const homeContent = useMemo(() => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <StatusCard analysis={analysis} loading={false} />
      {analysis && (
        <>
          <TimelineOverlay events={analysis.timeline || []} loading={loading || syncing} />
          <TideChart data={analysis.liveTides || []} loading={loading || syncing} />

          {/* Fontes de Dados */}
          {analysis.sources && analysis.sources.length > 0 && (
            <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ExternalLink size={12} /> Fontes de Dados Oficiais
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-colors"
                  >
                    {src.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  ), [analysis, loading, syncing]);

  const historyData = useMemo(() => analysis?.history || [], [analysis]);
  const riskZonesData = useMemo(() => analysis?.riskZones || [], [analysis]);

  const handleSelectEvent = useCallback((event: FloodHistory | RiskZone) => {
    setSelectedItem(event);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-blue-100">
      {/* Indicador de Sincronização */}
      {(syncing || (loading && analysis)) && (
        <div className="fixed top-0 inset-x-0 z-[100] h-1 bg-blue-600/10 overflow-hidden">
          <div className="h-full bg-blue-600 w-1/3 animate-[loading_1.5s_infinite_ease-in-out]"></div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <Waves size={18} strokeWidth={3} />
              </div>
              <h1 className="text-lg font-black dark:text-white tracking-tight italic">
                RECIFE<span className="text-blue-600">ALERTA</span>
              </h1>
            </div>
            {analysis && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={10} className="text-slate-400" />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${analysis.isStale ? 'text-orange-500' : 'text-slate-400'}`}>
                  {analysis.isStale ? 'Defasado (Cache): ' : 'Atualizado: '} {analysis.lastUpdate}
                </span>
              </div>
            )}
          </div>
          <button
            disabled={syncing || loading}
            onClick={() => loadData(true)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full active:scale-95 transition-all disabled:opacity-50"
            aria-label="Atualizar dados"
          >
            <RefreshCw size={18} className={`${(syncing || loading) ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </header>

      {/* Alert Banner — abaixo do header */}
      {analysis && analysis.level !== 'baixo' && (
        <AlertBanner
          level={analysis.level}
          title={analysis.title}
          message={analysis.message}
        />
      )}

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 pt-4 pb-28">
        {error && !analysis ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-full">
              <WifiOff size={48} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">Ops! Algo deu errado</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        ) : loading && !analysis ? (
          <div className="space-y-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <>
            {activeTab === 'home' && homeContent}

            {activeTab === 'map' && (
              <div className="fixed inset-0 top-[68px] z-40 bg-slate-100 dark:bg-slate-900">
                <Suspense fallback={
                  <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapeando Riscos...</span>
                  </div>
                }>
                  <InteractiveMap
                    history={historyData}
                    riskZones={riskZonesData}
                    onSelectEvent={handleSelectEvent}
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

      {/* Navegação Inferior */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-4 flex justify-between items-center z-[70] pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {[
          { id: 'home', icon: Home, label: 'Resumo' },
          { id: 'map', icon: MapPin, label: 'Zonas' },
          { id: 'history', icon: HistoryIcon, label: 'Histórico' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-95 ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Animações globais */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); width: 30%; }
          100% { transform: translateX(400%); width: 30%; }
        }
      `}</style>
    </div>
  );
};

export default App;
