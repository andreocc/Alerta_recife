
import { RiskAnalysis, GroundingSource } from "../types";

const CACHE_KEY = 'risk_analysis_recife_v2';
const DEFAULT_TTL_MINUTES = 15;

const cacheManager = {
  get: (): { data: RiskAnalysis; timestamp: number } | null => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  },
  set: (data: RiskAnalysis) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) { }
  }
};

async function callWorkerProxy(prompt: string): Promise<any> {
  const WORKER_API_URL = (import.meta as any).env?.VITE_WORKER_API_URL || '/api/gemini';
  
  const response = await fetch(WORKER_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) throw new Error(`API: ${response.status}`);
  return await response.json();
}

const performAnalysis = async (): Promise<RiskAnalysis> => {
  // Prompt ultra-otimizado para resposta rápida
  const prompt = `Defesa Civil Recife. Hoje. JSON:
  {
    "level": "low"|"medium"|"high"|"critical",
    "title": "str", "message": "1 frase",
    "recommendations": ["str"],
    "affectedNeighborhoods": ["str"],
    "lastUpdate": "HH:mm",
    "liveWeather": [{"time":"HH:mm","temp":num,"precipitation":num,"condition":"str"}],
    "liveTides": [{"time":"HH:mm","height":num,"type":"high"|"low"}],
    "timeline": [{"hour":"HH:mm","riskType":"rain"|"tide"|"combined","intensity":num}],
    "history": [{"id":"1","date":"DD/MM","time":"HH:mm","areas":["str"],"cause":"rain","severity":"moderate","lat":-8.0,"lng":-34.8}],
    "riskZones": [{"id":"z1","name":"str","level":"high","description":"str","polygon":[[-8.1,-34.9],[-8.1,-34.8]]}]
  }`;

  const geminiData = await callWorkerProxy(prompt);
  const contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!contentText) throw new Error("IA Empty");

  const result = JSON.parse(contentText);
  return { ...result, sources: [] } as RiskAnalysis;
};

export const analyzeRisk = async (
  forceRefresh: boolean = false,
  onCacheLoaded?: (data: RiskAnalysis) => void
): Promise<RiskAnalysis> => {
  const cached = cacheManager.get();
  if (cached) onCacheLoaded?.(cached.data);

  const isStale = !cached || (Date.now() - cached.timestamp > DEFAULT_TTL_MINUTES * 60 * 1000);
  if (!isStale && !forceRefresh && cached) return cached.data;

  try {
    const freshData = await performAnalysis();
    cacheManager.set(freshData);
    return freshData;
  } catch (error) {
    if (cached) return { ...cached.data, isStale: true };
    throw error;
  }
};
