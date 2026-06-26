import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import {
  Waves, MapPin, RefreshCw, Home, History as HistoryIcon, WifiOff, Clock, ExternalLink,
} from 'lucide-react';
import { TideChart } from './components/TideChart';
import { StatusCard } from './components/StatusCard';
import { HistorySection } from './components/HistorySection';
import { TimelineOverlay } from './components/TimelineOverlay';
import { AlertBanner } from './components/AlertBanner';
import { analyzeRisk } from './services/riskEngine';
import { cleanupOldAlerts } from './services/notificationService';
import { RiskAnalysis, FloodHistory, RiskZone, RiskLevel } from './types';

const InteractiveMap = lazy(() => import('./components/InteractiveMap').then(m => ({ default: m.InteractiveMap })));

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-3xl ${className}`} />
);

// ── Background dinâmico por nível ──────────────────────────
const RiskBackground: React.FC<{ level: RiskLevel; children: React.ReactNode }> = ({ level, children }) => {
  const gradients: Record<RiskLevel, string> = {
    baixo: 'from-emerald-500/5 via-transparent to-transparent',
    médio: 'from-amber-400/8 via-transparent to-transparent',
    alto: 'from-orange-500/10 via-transparent to-transparent',
    crítico: 'from-red-500/12 via-red-500/5 to-transparent',
    extremo: 'from-purple-600/15 via-fuchsia-600/5 to-transparent',
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
      {/* Gradiente radial superior (luz ambiente) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 inset-x-0 h-[60vh] bg-gradient-to-b ${gradients[level]} transition-all duration-1000`} />
        <div className="absolute bottom-0 right-0 w-[80vw] h-[40vh] bg-gradient-to-tl from-blue-500/3 via-transparent to-transparent" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// ── Navegação flutuante (pílula) ───────────────────────────
const FloatingNav: React.FC<{
  activeTab: string;
  onTabChange: (tab: 'home' | 'map' | 'history') => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Resumo' },
    { id: 'map', icon: MapPin, label: 'Zonas' },
    { id: 'history', icon: HistoryIcon, label: 'Histórico' },
  ] as const;

  return (
    <div className="fixed bottom-6 inset-x-0 z-[80] flex justify-center pointer-events-none">
      <nav className="pointer-events-auto glass shadow-3d-lg rounded-full px-2 py-2 flex items-center gap-1 border border-white/20 dark:border-slate-700/30">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center px-5 py-2 rounded-full transition-all duration-300 ease-out ${
                isActive
                  ? 'text-white scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {/* Bolha ativa com gradiente */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/30" />
              )}
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
              <span className={`text-[9px] font-black uppercase tracking-tighter mt-0.5 relative z-10 ${isActive ? 'text-white/90' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// ── App ────────────────────────────────────────────────────
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

  useEffect(() => { cleanupOldAlerts(); }, []);

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

  useEffect(() => { loadData(); }, []);

  const riskLevel = analysis?.level ?? 'baixo';

  const homeContent = useMemo(() => (
    <div className="space-y-4 animate-fade-in">
      <StatusCard analysis={analysis} loading={false} />
      {analysis && (
        <>
          <TimelineOverlay events={analysis.timeline || []} loading={loading || syncing} />
          <TideChart data={analysis.liveTides || []} loading={loading || syncing} />

          {analysis.sources && analysis.sources.length > 0 && (
            <div className="glass rounded-2xl p-4 shadow-3d">
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
                    className="text-[10px] font-bold text-blue-600 bg-blue-50/80 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-100/50 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all active:scale-95"
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
    <RiskBackground level={riskLevel}>
      {/* Indicador de sincronização (linha fina no topo) */}
      {(syncing || (loading && analysis)) && (
        <div className="fixed top-0 inset-x-0 z-[100] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 animate-shimmer" />
      )}

      {/* Header vidro */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 dark:border-slate-800/30 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo com gradiente */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Waves size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black dark:text-white tracking-tight leading-tight">
                RECIFE<span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">ALERTA</span>
              </h1>
              {analysis && (
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${analysis.isStale ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {analysis.isStale ? 'Cache' : 'Ao vivo'} · {analysis.lastUpdate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botão refresh com vidro */}
          <button
            disabled={syncing || loading}
            onClick={() => loadData(true)}
            className="glass rounded-full p-2.5 active:scale-90 transition-all disabled:opacity-50 shadow-3d"
            aria-label="Atualizar dados"
          >
            <RefreshCw size={18} className={`${(syncing || loading) ? 'animate-spin text-blue-500' : 'text-slate-500'}`} />
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

      {/* Conteúdo principal */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 pt-4 pb-32">
        {error && !analysis ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in">
            <div className="glass rounded-full p-6 shadow-3d">
              <WifiOff size={48} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">Ops! Algo deu errado</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-8 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        ) : loading && !analysis ? (
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <>
            {activeTab === 'home' && homeContent}

            {activeTab === 'map' && (
              <div className="fixed inset-0 top-[56px] z-40 bg-slate-100 dark:bg-slate-900">
                <Suspense fallback={
                  <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
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
              <div className="animate-fade-in">
                <HistorySection history={analysis?.history || []} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Navegação flutuante */}
      <FloatingNav activeTab={activeTab} onTabChange={setActiveTab} />
    </RiskBackground>
  );
};

export default App;
