
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Waves, MapPin, Clock, AlertCircle, RefreshCw, X, 
  Search, Info, Star, ChevronRight, Navigation, ShieldAlert,
  CloudRain, Shield, Database, AlertTriangle, Home, History as HistoryIcon, 
  Settings, Share2, LocateFixed, Maximize
} from 'lucide-react';
import { TideChart } from './components/TideChart';
import { StatusCard } from './components/StatusCard';
import { HistorySection } from './components/HistorySection';
import { InteractiveMap } from './components/InteractiveMap';
import { TimelineOverlay } from './components/TimelineOverlay';
import { analyzeRisk } from './services/geminiService';
import { RiskAnalysis, FloodHistory, RiskZone, UserPreferences } from './types';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FloodHistory | RiskZone | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'history' | 'settings'>('home');
  const [preferences, setPreferences] = useState<UserPreferences>({ savedAreas: [] });
  const [showGuide, setShowGuide] = useState(false);

  // Efeito de vibração para alertas críticos
  useEffect(() => {
    if (analysis?.level === 'critical' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [analysis]);

  const loadData = useCallback(async (force: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRisk(force);
      setAnalysis(result);
      if (result.isStale) {
        setError("Usando dados de cache. Verifique sua conexão.");
      }
    } catch (err) {
      setError("Erro ao carregar dados. Tente atualizar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleShare = async () => {
    if (navigator.share && analysis) {
      try {
        await navigator.share({
          title: 'Alerta Recife: Risco de Alagamento',
          text: `Status em Recife: ${analysis.level.toUpperCase()}. ${analysis.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing", err);
      }
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'map', icon: MapPin, label: 'Mapa' },
    { id: 'history', icon: HistoryIcon, label: 'Histórico' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      
      {/* Sticky Top Action Bar (Mobile Only - Critical) */}
      {analysis?.level === 'critical' && (
        <div className="sticky top-0 z-[60] bg-red-600 text-white shadow-lg animate-pulse md:hidden">
          <div className="px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>Risco Crítico</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('map')} className="bg-white/20 px-2 py-1 rounded">Ver Mapa</button>
              <button onClick={handleShare} className="bg-white/20 px-2 py-1 rounded"><Share2 size={12} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Header Compacto */}
      <header className="sticky top-0 md:top-auto z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg md:rounded-xl text-white">
              <Waves size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">ALERTA RECIFE</h1>
              <div className="flex items-center gap-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                 <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live: {analysis?.lastUpdate || '--:--'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="p-2.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full md:hidden">
              <Share2 size={18} />
            </button>
            <button 
              onClick={() => loadData(true)} 
              disabled={loading} 
              className="p-2.5 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Viewport Principal */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 md:px-6 pt-6 pb-24 md:pb-12 space-y-6">
        
        {/* Desktop Layout - Grid (Mobile uses Tabs) */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <StatusCard analysis={analysis} loading={loading} />
            <div id="desktop-map" className="h-[450px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
               <InteractiveMap history={analysis?.history || []} riskZones={analysis?.riskZones || []} onSelectEvent={setSelectedItem} />
            </div>
            <div className="grid grid-cols-2 gap-6">
               <TideChart data={analysis?.liveTides || []} />
               <TimelineOverlay events={analysis?.timeline || []} />
            </div>
            <HistorySection history={analysis?.history || []} />
          </div>
          <div className="space-y-6">
             <section className="bg-slate-900 dark:bg-blue-900 rounded-3xl p-6 text-white shadow-xl">
                <h3 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest"><Star className="text-amber-400" size={16} /> Bairros em Foco</h3>
                <div className="space-y-2">
                  {analysis?.affectedNeighborhoods.map((b, i) => (
                    <div key={i} className="bg-white/10 p-3 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/20">
                      <span className="text-sm font-bold">{b}</span>
                      <ChevronRight size={14} />
                    </div>
                  ))}
                </div>
             </section>
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Ação Rápida</h4>
                <button onClick={() => setShowGuide(true)} className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-3 font-bold hover:bg-slate-200 transition-colors">
                  <Shield className="text-blue-600" size={20} /> Guia de Segurança
                </button>
             </div>
          </div>
        </div>

        {/* Mobile View - Conditional Tabs */}
        <div className="md:hidden space-y-6">
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <StatusCard analysis={analysis} loading={loading} />
              <TimelineOverlay events={analysis?.timeline || []} />
              <TideChart data={analysis?.liveTides || []} />
              <div className="bg-slate-900 rounded-3xl p-6 text-white">
                <h3 className="text-xs font-black uppercase mb-4 tracking-widest flex items-center gap-2">
                   <ShieldAlert size={14} className="text-red-400" /> Áreas Monitoradas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {analysis?.affectedNeighborhoods.slice(0, 6).map((b, i) => (
                    <div key={i} className="bg-white/10 p-3 rounded-xl text-xs font-bold">{b}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="fixed inset-0 top-[64px] md:relative md:top-0 z-40 bg-white dark:bg-slate-950">
              <div className="h-full w-full relative">
                <InteractiveMap history={analysis?.history || []} riskZones={analysis?.riskZones || []} onSelectEvent={setSelectedItem} />
                
                {/* Floating controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
                  <button className="p-3 bg-white dark:bg-slate-800 shadow-xl rounded-xl"><LocateFixed size={20} /></button>
                  <button className="p-3 bg-white dark:bg-slate-800 shadow-xl rounded-xl"><Maximize size={20} /></button>
                </div>

                {/* Mobile Bottom Sheet Detail */}
                {selectedItem && (
                  <div className="absolute inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl p-6 pb-28 border-t border-slate-200 dark:border-slate-800">
                      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" onClick={() => setSelectedItem(null)}></div>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {'name' in selectedItem ? selectedItem.name : selectedItem.areas.join(', ')}
                        </h4>
                        <button onClick={() => setSelectedItem(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                        {'description' in selectedItem ? selectedItem.description : `Registro de alagamento ocorrido em ${selectedItem.date} às ${selectedItem.time}. Causa: ${selectedItem.cause === 'both' ? 'Chuva e Maré' : selectedItem.cause}.`}
                      </p>
                      <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none">
                        <Navigation size={18} /> VER ROTAS ALTERNATIVAS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <HistorySection history={analysis?.history || []} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black dark:text-white">Ajustes</h2>
              <div className="space-y-3">
                 <button onClick={() => setShowGuide(true)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Info size={20} className="text-blue-600" />
                       <span className="font-bold">Guia de Emergência</span>
                    </div>
                    <ChevronRight size={18} />
                 </button>
                 <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Sobre o Sistema</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">Protótipo v2.5 otimizado para mobile. Desenvolvido para auxílio preventivo da população do Recife.</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-[70] pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => {
                setActiveTab(item.id as any);
                if ('vibrate' in navigator) navigator.vibrate(5);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/50 scale-110' : ''}`}>
                <Icon size={22} strokeWidth={active ? 3 : 2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X /></button>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="text-blue-600" /> Guia de Emergência
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-xl border-l-4 border-blue-600">
                 <h5 className="font-bold text-sm mb-1">1. Evite Alagamentos</h5>
                 <p className="text-xs text-slate-600 dark:text-slate-400">Não atravesse ruas com água acima do tornozelo. Veículos podem flutuar.</p>
              </div>
              <div className="bg-amber-50 dark:bg-slate-800 p-4 rounded-xl border-l-4 border-amber-500">
                 <h5 className="font-bold text-sm mb-1">2. Contatos Úteis</h5>
                 <p className="text-xs text-slate-600 dark:text-slate-400">Defesa Civil: 0800 081 3400. Bombeiros: 193.</p>
              </div>
            </div>
            <button onClick={() => setShowGuide(false)} className="mt-8 w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-bold">FECHAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
