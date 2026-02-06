
import { RiskAnalysis, GroundingSource } from "../types";

// Tipos internos para o gerenciador de cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry<any>> = {};
const DEFAULT_TTL_MINUTES = 15;

/**
 * Helper genérico para gerenciamento de cache
 */
async function getWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMinutes: number,
  forceRefresh: boolean = false
): Promise<{ data: T; isStale: boolean }> {
  const now = Date.now();
  const ttlMs = ttlMinutes * 60 * 1000;
  const entry = memoryCache[key];

  if (!forceRefresh && entry && (now - entry.timestamp < ttlMs)) {
    return { data: entry.data, isStale: false };
  }

  try {
    const freshData = await fetchFn();
    memoryCache[key] = { data: freshData, timestamp: now };
    return { data: freshData, isStale: false };
  } catch (error) {
    console.error(`Erro ao atualizar recurso [${key}]:`, error);
    if (entry) return { data: entry.data, isStale: true };
    throw error;
  }
}

/**
 * Função de chamada ao Worker Proxy
 */
async function callWorkerProxy(prompt: string): Promise<any> {
  // Tenta obter do env do Vite ou usa caminho relativo para produção no CF Pages
  const WORKER_API_URL = (import.meta as any).env?.VITE_WORKER_API_URL || '/api/gemini';
  
  const response = await fetch(WORKER_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na API: ${response.status}`);
  }

  return await response.json();
}

/**
 * Realiza a análise de risco via Worker Proxy
 */
const performAnalysis = async (): Promise<RiskAnalysis> => {
  const prompt = `
    Aja como um analista sênior da Defesa Civil de Recife.
    Use ferramentas de busca para obter dados REAIS de hoje:
    1. Previsão do tempo Recife (precipitação por hora).
    2. Tábua de marés Porto do Recife.
    3. Histórico recente de alagamentos.

    Gere uma resposta JSON estrita contendo:
    - 'level': low, medium, high, ou critical.
    - 'title', 'message', 'recommendations' (array).
    - 'affectedNeighborhoods' (array).
    - 'lastUpdate' (HH:mm).
    - 'liveWeather' (array de {time, temp, precipitation, condition}).
    - 'liveTides' (array de {time, height, type}).
    - 'timeline' (array de {hour, riskType, intensity, label}).
    - 'history' (array de {id, date, time, areas, cause, severity, lat, lng}).
    - 'riskZones' (array de {id, name, level, description, polygon: [[lat,lng],...]}).

    Considere: Maré > 2.0m + Chuva > 50% = Risco Crítico.
  `;

  const geminiData = await callWorkerProxy(prompt);
  
  // Extrai o texto do formato de resposta do Gemini
  const contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!contentText) throw new Error("Resposta inválida da IA");

  // Limpa possíveis marcações de markdown se o modelo as incluir
  const cleanedJson = contentText.replace(/```json/g, '').replace(/```/g, '').trim();
  const result = JSON.parse(cleanedJson);

  // Extrai fontes de aterramento (grounding) se existirem
  const sources: GroundingSource[] = [];
  geminiData.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
    if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
  });

  return { ...result, sources } as RiskAnalysis;
};

/**
 * Ponto de entrada público
 */
export const analyzeRisk = async (forceRefresh: boolean = false): Promise<RiskAnalysis> => {
  const { data, isStale } = await getWithCache<RiskAnalysis>(
    'risk_analysis_recife',
    performAnalysis,
    DEFAULT_TTL_MINUTES,
    forceRefresh
  );
  
  return { ...data, isStale };
};
