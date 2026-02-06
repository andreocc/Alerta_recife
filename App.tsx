
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Waves, MapPin, Clock, AlertCircle, RefreshCw, Bell, X, 
  Search, Maximize2, Phone, Info, Star, ChevronRight, Navigation, ShieldAlert,
  // Added missing icons used in footer
  CloudRain, Shield
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
  const [preferences, setPreferences] = useState<UserPreferences>({ savedAreas: [] });
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recife_pref');
    if (saved) setPreferences(JSON.parse(saved));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRisk();
      setAnalysis(result);
    } catch (err) {
      setError("Erro ao obter dados reais. Tente atualizar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFavorite = (areaName: string) => {
     // Simulação de salvar área de interesse
     console.log("Saving area:", areaName);
  };

  return (
    <div className="min-h-screen pb-10 bg-slate-50 flex flex-col">
      {/* Alerta Crítico Superior */}
      {analysis?.level === 'critical' && (
        <div className="bg-red-600 text-white animate-pulse sticky top-0 z-50 shadow-lg">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} />
              <div className="text-sm">
                <p className="font-black uppercase tracking-tight">Risco Crítico de Alagamento</p>
                <p className="text-xs font-medium opacity-90 italic">Bairros: {analysis.affectedNeighborhoods.slice(0, 3).join(', ')}...</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowGuide(true)} className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm">Como agir</button>
              <button onClick={() => document.getElementById('map')?.scrollIntoView({behavior:'smooth'})} className="bg-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-800 transition-colors shadow-sm">Ver Mapa</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <Waves size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">ALERTA RECIFE</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Defesa Civil Inteligente</p>
          </div>
        </div>
        <button onClick={loadData} disabled={loading} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8 flex-grow">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Status e Timeline */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StatusCard analysis={analysis} loading={loading} />
          </div>
          <div className="space-y-6">
            {analysis && <TimelineOverlay events={analysis.timeline} />}
          </div>
        </section>

        {/* Mapa e Painel Lateral */}
        <section id="map" className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2">
              <MapPin className="text-red-500" size={18} />
              <h3 className="font-bold text-slate-800">Mapa de Zonas de Risco</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 italic">Atualizado em: {analysis?.lastUpdate}</span>
          </div>
          <div className="h-[500px] flex flex-col md:flex-row">
            <div className="flex-grow relative h-full">
              <InteractiveMap 
                history={analysis?.history || []} 
                riskZones={analysis?.riskZones || []}
                onSelectEvent={setSelectedItem}
              />
            </div>
            {selectedItem && (
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 p-6 bg-slate-50 animate-in slide-in-from-right md:slide-in-from-right duration-300 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Detalhes da Área</h4>
                   <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                {'name' in selectedItem ? (
                  <div>
                    <h4 className="text-xl font-black text-slate-800 mb-2 leading-tight">{selectedItem.name}</h4>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      selectedItem.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>Risco {selectedItem.level}</span>
                    <p className="text-sm text-slate-600 mt-4 leading-relaxed">{selectedItem.description}</p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{selectedItem.areas.join(', ')}</h4>
                    <p className="text-xs text-slate-400 mb-4">{selectedItem.date} às {selectedItem.time}</p>
                    <div className="space-y-3">
                       <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Causa Confirmada</p>
                          <p className="text-sm font-semibold text-slate-700 capitalize">{selectedItem.cause}</p>
                       </div>
                    </div>
                  </div>
                )}
                <button className="mt-8 w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                  <Navigation size={16} /> Rotas Alternativas
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Seções de Detalhe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <TideChart data={analysis?.liveTides || []} />
           <HistorySection history={analysis?.history || []} />
        </div>

        {/* Bairros e Áreas Favoritas */}
        <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <Star className="text-amber-400" fill="currentColor" /> Bairros Sob Monitoramento Hoje
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analysis?.affectedNeighborhoods.map((bairro, idx) => (
              <div key={idx} className="bg-white/10 hover:bg-white/20 transition-all cursor-pointer p-4 rounded-2xl flex items-center justify-between group border border-white/5">
                <span className="font-bold text-sm tracking-tight">{bairro}</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </section>

        {/* Fontes de Dados */}
        {analysis && (
          <section className="bg-white border border-slate-200 rounded-3xl p-8">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Search size={14} /> Fontes de Dados em Tempo Real
             </h4>
             <div className="flex flex-wrap gap-2">
                {analysis.sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                    {s.title}
                  </a>
                ))}
             </div>
          </section>
        )}
      </main>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X /></button>
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Info className="text-blue-600" />
              Guia de Emergência
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-blue-100 text-blue-600 p-3 h-fit rounded-xl font-black shrink-0">1</div>
                <div>
                   <h5 className="font-bold text-slate-800 mb-1">Evite zonas de risco</h5>
                   <p className="text-sm text-slate-600 leading-relaxed">Não tente atravessar ruas alagadas. A força da água pode arrastar veículos e esconder buracos ou bueiros abertos.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-blue-100 text-blue-600 p-3 h-fit rounded-xl font-black shrink-0">2</div>
                <div>
                   <h5 className="font-bold text-slate-800 mb-1">Segurança Elétrica</h5>
                   <p className="text-sm text-slate-600 leading-relaxed">Em caso de invasão de água na residência, desligue imediatamente o quadro geral de energia e evite contato com tomadas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-blue-100 text-blue-600 p-3 h-fit rounded-xl font-black shrink-0">3</div>
                <div>
                   <h5 className="font-bold text-slate-800 mb-1">Contatos Oficiais</h5>
                   <p className="text-sm text-slate-600 leading-relaxed">Acione a Defesa Civil pelo 0800 081 3400 ou os Bombeiros pelo 193 para emergências reais.</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowGuide(false)} className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">Entendi</button>
          </div>
        </div>
      )}

      {/* Footer - Créditos e Aviso Legal */}
      <footer className="mt-12 py-12 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-slate-500 max-w-2xl leading-relaxed">
              Protótipo independente e gratuito para a população do Recife. Desenvolvido por André Occenstein (2026).
            </p>
            <p className="text-[10px] font-medium text-slate-400 max-w-xl leading-relaxed italic">
              Este sistema é experimental e não é canal oficial da Prefeitura ou da Defesa Civil. 
              As previsões e análises são geradas por Inteligência Artificial (Gemini) baseada em dados públicos e podem conter imprecisões.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-4 text-slate-300">
            <Waves size={16} />
            <CloudRain size={16} />
            <Shield size={16} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
