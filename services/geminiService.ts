
import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysis, GroundingSource } from "../types";

// Initialize the Google GenAI client with the API key from environment variables.
// Always use the named parameter and assume API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRisk = async (): Promise<RiskAnalysis> => {
  const prompt = `
    Aja como um analista sênior da Defesa Civil de Recife.
    Use a busca do Google para obter dados REAIS de hoje em Recife:
    1. Previsão do tempo (probabilidade de chuva por hora).
    2. Tábua de marés completa (Porto do Recife).
    3. Notícias de alagamentos reais nas últimas 24h e histórico de 1 ano.

    Gere uma análise no formato JSON contendo:
    - 'level': low, medium, high, ou critical.
    - 'affectedNeighborhoods': Lista de bairros com maior risco imediato.
    - 'riskZones': Lista de objetos com 'name', 'level' e um 'polygon' (array de 4-5 coordenadas [lat, lng]) delimitando áreas críticas conhecidas (ex: Bacia do Pina, Av. Agamenon Magalhães).
    - 'timeline': Uma lista de eventos de 00h às 23h de hoje mostrando a intensidade do risco (0-100) baseada na coincidência de chuva e maré.
    - 'history': Últimas 5 ocorrências confirmadas.
    - 'lastUpdate': Horário atual da análise.

    Considere: Maré > 2.0m + Chuva > 50% = Risco Crítico.
  `;

  try {
    // Calling generateContent with the appropriate model and configuration for search grounding and JSON output.
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

    // Extract text directly from the response object as it's a property.
    const result = JSON.parse(response.text || '{}');
    const sources: GroundingSource[] = [];
    // Always extract and list grounding sources when using Google Search.
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
    });

    return { ...result, sources } as RiskAnalysis;
  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    throw error;
  }
};
