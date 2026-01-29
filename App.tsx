
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Waves, 
  CloudRain, 
  MapPin, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Bell,
  X,
  History as HistoryIcon,
  ExternalLink,
  Search,
  Maximize2,
  Phone,
  Info
} from 'lucide-react';
import { TideChart } from './components/TideChart';
import { StatusCard } from './components/StatusCard';
import { HistorySection } from './components/HistorySection';
import { InteractiveMap } from './components/InteractiveMap';
import { analyzeRisk } from './services/geminiService';
import { TideData, WeatherData, RiskAnalysis, FloodHistory } from './types';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [history, setHistory] = useState<FloodHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSystemAlert, setShowSystemAlert] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const riskResult = await analyzeRisk();
      setAnalysis(riskResult);
      setHistory(riskResult.history);

      if (riskResult.isSpecificWarningTriggered) {
        setShowSystemAlert(true);
      } else {
        setShowSystemAlert(false);
      }
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados em tempo real. Verifique sua conexão ou tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, [loadData]);

  const maxRain = analysis?.liveWeather.reduce((max, w) => Math.max(max, w.precipitation), 0) || 0;
  const maxTide = analysis?.liveTides.reduce((max, t) => Math.max(max, t.height), 0) || 0;
  const nextHighTide = analysis?.liveTides.find(t => t.type === 'high') || (analysis?.liveTides && analysis.liveTides[0]);

  return (
    <div className="min-h-screen pb-20">
      {showSystemAlert && (
        <div className="bg-red-600 text-white animate-in slide-in-from-top duration-500 sticky top-0 z-50 shadow-lg">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bell size={18} className="animate-bounce" />
              </div>
              <p className="text-sm font-bold leading-tight">
                <span className="uppercase">Alerta Crítico:</span> Probabilidade de Chuva ({maxRain}%) e Maré Alta ({maxTide}m) HOJE!
              </p>
            </div>
            <button onClick={() => setShowSystemAlert(false)} className="p-1 hover:bg-white/10 rounded-full">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <header className={`bg-white border-b border-slate-200 sticky ${showSystemAlert ? 'top-[44px]' : 'top-0'} z-30 px-6 py-4 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/80 transition-all`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Waves size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">ALERTA RECIFE</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dados Reais e Históricos via Gemini Search</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <Search size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Dados Reais</span>
          </div>
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 disabled:opacity-50"
            title="Atualizar Dados"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-12">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 font-medium">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <section>
           <StatusCard analysis={analysis} loading={loading} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {analysis && <TideChart data={analysis.liveTides} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <Waves className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Próxima Maré Alta</p>
                  <p className="text-xl font-bold text-slate-800">
                    {nextHighTide ? `${nextHighTide.time} (${nextHighTide.height}m)` : 'Consultando...'}
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <CloudRain className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Precipitação Máxima</p>
                  <p className="text-xl font-bold text-slate-800">{maxRain}% prevista</p>
                </div>
              </div>
            </div>

            {/* Grounding Sources */}
            {analysis && analysis.sources.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Search size={14} /> Fontes Pesquisadas (Tempo Real)
                </h4>
                <div className="flex flex-wrap gap-3">
                  {analysis.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                      <ExternalLink size={12} />
                      {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Phone size={18} className="text-blue-400" />
                  Contatos Úteis
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Defesa Civil</span>
                    <span className="text-lg font-black text-blue-400">0800 081 3400</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 text-sm">Bombeiros</span>
                    <span className="text-lg font-black text-red-400">193</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                Dica de Hoje
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                {analysis?.message ? analysis.message.substring(0, 120) + '...' : 'Carregando análise do dia...'}
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Map Visualization */}
        <section className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={18} className="text-red-500" />
              Mapa de Ocorrências Reais
            </h3>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Grave</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Moderado</span>
               </div>
            </div>
          </div>
          <div className="h-[500px] bg-slate-100 relative">
            <InteractiveMap history={history} />
            
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center text-center px-4">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-3 max-w-xs">
                  <RefreshCw className="animate-spin text-blue-500" size={32} />
                  <p className="text-sm font-bold text-slate-700">Buscando dados de clima, maré e histórico de alagamentos reais em Recife...</p>
                </div>
              </div>
            )}
            
            <button className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-white/20 hover:bg-white transition-colors">
              <Maximize2 size={18} className="text-slate-600" />
            </button>
          </div>
        </section>

        <section id="history" className="scroll-mt-24">
          <HistorySection history={history} />
        </section>
      </main>

      {/* Persistent Nav Bar for Mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white rounded-full shadow-2xl px-8 py-4 flex items-center gap-10 md:hidden z-50 border border-white/10">
        <button 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          className="flex flex-col items-center gap-1"
        >
          <AlertCircle size={20} className="text-blue-400" />
          <span className="text-[10px] font-bold">Resumo</span>
        </button>
        <button 
          onClick={() => document.getElementById('history')?.scrollIntoView({behavior: 'smooth'})}
          className="flex flex-col items-center gap-1"
        >
          <HistoryIcon size={20} className="text-slate-400" />
          <span className="text-[10px] font-bold">Histórico</span>
        </button>
        <button className="flex flex-col items-center gap-1" onClick={() => {
            const el = document.querySelector('section:has(.leaflet-container)');
            el?.scrollIntoView({ behavior: 'smooth' });
        }}>
          <MapPin size={20} className="text-red-400" />
          <span className="text-[10px] font-bold">Mapa</span>
        </button>
      </div>

      <footer className="text-center py-12 px-6">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Sistema Inteligente Alerta Recife - V2.5 Live Data</p>
        <p className="text-slate-300 text-[10px] mt-1 italic">Todos os dados de alagamento acima são baseados em pesquisas em tempo real de notícias e boletins oficiais.</p>
      </footer>
    </div>
  );
};

export default App;
