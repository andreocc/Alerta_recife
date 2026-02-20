
import { GoogleGenAI } from "@google/genai";
import { RiskAnalysis, GroundingSource } from "../types";

const CACHE_KEY = 'risk_analysis_recife_v5';
const DEFAULT_TTL_MINUTES = 10;

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

const performAnalysis = async (): Promise<RiskAnalysis> => {
  const ai = getAI();
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const prompt = `Você é o sistema de inteligência da Defesa Civil do Recife.
Data/Hora atual: ${dateStr} às ${timeStr}.

TAREFA: Analise o risco operacional hoje em Recife usando Google Search.
FOCO NA POPULAÇÃO: Use linguagem direta, sem jargões (ex: evite "VCAN", "sizígia" no resumo).

ESTRUTURA DE RESPOSTA (Obrigatório responder):
1. O QUE está acontecendo? (Fato principal)
2. ONDE exatamente? (Bairros ou regiões específicas)
3. O QUE FAZER agora? (Ações práticas imediatas)

NÍVEIS DE RISCO: "baixo" (verde), "médio" (amarelo), "alto" (laranja), "crítico" (vermelho), "extremo" (roxo).

RETORNE JSON:
{
  "level": "baixo"|"médio"|"alto"|"crítico"|"extremo",
  "breakdown": {
    "meteorological": "baixo"|"médio"|"alto"|"crítico"|"extremo",
    "hydrological": "baixo"|"médio"|"alto"|"crítico"|"extremo",
    "geotechnical": "baixo"|"médio"|"alto"|"crítico"|"extremo"
  },
  "summary": {
    "what": "Explicação curta do evento atual",
    "where": "Lista de bairros ou regiões em risco",
    "actions": ["3 a 5 ações práticas e curtas"]
  },
  "title": "Título operacional impactante",
  "message": "Frase curta de impacto para alerta",
  "technicalDetails": "Coloque aqui os jargões e dados técnicos (ex: milímetros de chuva, metros da maré)",
  "recommendations": {
    "general": ["Dicas gerais"],
    "slopes": ["Dicas para morros"],
    "plains": ["Dicas para áreas baixas"]
  },
  "affectedNeighborhoods": ["Bairros prioritários"],
  "lastUpdate": "${dateStr} às ${timeStr}",
  "liveWeather": [{"time": "HH:mm", "temp": number, "precipitation": number, "condition": "string"}],
  "liveTides": [{"time": "HH:mm", "height": number, "type": "high"|"low"}],
  "timeline": [{"hour": "HH:mm", "riskType": "rain"|"tide"|"combined", "intensity": number}],
  "history": [{"id": "string", "date": "string", "time": "string", "areas": ["string"], "cause": "rain"|"tide"|"both", "severity": "moderate"|"severe", "lat": number, "lng": number}],
  "riskZones": [{"id": "string", "name": "string", "level": "baixo"|"médio"|"alto"|"crítico"|"extremo", "description": "string", "polygon": [[number, number]]}]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.1
      },
    });

    const candidate = response.candidates?.[0];
    const text = response.text;
    if (!text) throw new Error("Sem dados.");

    const sources: GroundingSource[] = [];
    if (candidate?.groundingMetadata?.groundingChunks) {
      candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) sources.push({ title: chunk.web.title || "Fonte", uri: chunk.web.uri });
      });
    }

    const result = JSON.parse(text);
    return { ...result, sources, lastUpdate: `${dateStr} às ${timeStr}` } as RiskAnalysis;
  } catch (error) {
    console.error(error);
    throw new Error("Erro ao sincronizar dados da Defesa Civil.");
  }
};

export const analyzeRisk = async (forceRefresh: boolean = false): Promise<RiskAnalysis> => {
  const cached = cacheManager.get();
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
