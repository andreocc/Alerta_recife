
import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysis, GroundingSource } from "../types";

// Tipos internos para o gerenciador de cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Armazenamento em memória (persiste durante a sessão da aba)
const memoryCache: Record<string, CacheEntry<any>> = {};
const DEFAULT_TTL_MINUTES = 15;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper genérico para gerenciamento de cache com suporte a fallback de dados obsoletos (stale)
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

  // Se não for forçado e o cache for válido dentro do TTL
  if (!forceRefresh && entry && (now - entry.timestamp < ttlMs)) {
    return { data: entry.data, isStale: false };
  }

  try {
    const freshData = await fetchFn();
    memoryCache[key] = { data: freshData, timestamp: now };
    return { data: freshData, isStale: false };
  } catch (error) {
    console.error(`Erro ao atualizar recurso [${key}]:`, error);
    
    // Se houver dado anterior, retorna ele com a flag de obsoleto
    if (entry) {
      return { data: entry.data, isStale: true };
    }
    
    // Se não houver nada, propaga o erro para ser tratado na UI
    throw error;
  }
}

/**
 * Realiza a chamada bruta à API Gemini para análise de risco
 */
const performAnalysis = async (): Promise<RiskAnalysis> => {
  const prompt = `
    Aja como um analista sênior da Defesa Civil de Recife.
    Use a busca do Google para obter dados REAIS de hoje em Recife:
    1. Previsão do tempo (probabilidade de chuva por hora).
    2. Tábua de marés completa (Porto do Recife).
    3. Notícias de alagamentos reais nas últimas 24h e histórico de 1 ano.

    Gere uma análise no formato JSON contendo:
    - 'level': low, medium, high, ou critical.
    - 'affectedNeighborhoods': Lista de bairros com maior risco imediato.
    - 'riskZones': Lista de objetos com 'name', 'level' e um 'polygon' (array de 4-5 coordenadas [lat, lng]) delimitando áreas críticas conhecidas.
    - 'timeline': Lista de eventos de 00h às 23h de hoje (risco 0-100).
    - 'history': Últimas 5 ocorrências confirmadas.
    - 'lastUpdate': Horário atual da análise (HH:mm).

    Considere: Maré > 2.0m + Chuva > 50% = Risco Crítico.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING },
          title: { type: Type.STRING },
          message: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          isSpecificWarningTriggered: { type: Type.BOOLEAN },
          affectedNeighborhoods: { type: Type.ARRAY, items: { type: Type.STRING } },
          lastUpdate: { type: Type.STRING },
          liveWeather: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                temp: { type: Type.NUMBER },
                precipitation: { type: Type.NUMBER },
                condition: { type: Type.STRING }
              }
            }
          },
          liveTides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                height: { type: Type.NUMBER },
                type: { type: Type.STRING }
              }
            }
          },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hour: { type: Type.STRING },
                riskType: { type: Type.STRING },
                intensity: { type: Type.NUMBER },
                label: { type: Type.STRING }
              }
            }
          },
          riskZones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                level: { type: Type.STRING },
                description: { type: Type.STRING },
                polygon: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } }
              }
            }
          },
          history: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                areas: { type: Type.ARRAY, items: { type: Type.STRING } },
                cause: { type: Type.STRING },
                severity: { type: Type.STRING },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                details: { type: Type.STRING }
              }
            }
          }
        },
        required: ["level", "title", "message", "affectedNeighborhoods", "riskZones", "timeline", "history", "lastUpdate"]
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  const sources: GroundingSource[] = [];
  response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
    if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
  });

  return { ...result, sources } as RiskAnalysis;
};

/**
 * Ponto de entrada público para análise com cache integrado de 15 minutos
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
