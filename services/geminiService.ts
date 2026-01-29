
import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysis, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeRisk = async (): Promise<RiskAnalysis> => {
  const prompt = `
    Use a busca do Google para encontrar os dados REAIS e ATUAIS para HOJE na cidade do Recife, PE:
    1. Previsão do tempo detalhada (probabilidade de chuva em % para os períodos Manhã, Tarde e Noite).
    2. Tábua de marés para o Porto do Recife hoje (horários e alturas das marés altas e baixas).
    3. Histórico de eventos REAIS de alagamento em Recife nos últimos 12 meses. Identifique pelo menos 4 eventos significativos com data, áreas/ruas afetadas, causa (chuva, maré ou ambos) e gravidade. Forneça coordenadas lat/lng aproximadas para cada local (ex: Bairro do Recife ~ -8.06, -34.87).

    Analise o risco de alagamento para HOJE:
    - O risco é CRÍTICO se maré alta (> 2.0m) coincidir com chuva forte (> 70% de probabilidade).
    - Defina isSpecificWarningTriggered como true se essa condição ocorrer hoje.

    Retorne os dados no formato JSON especificado. 
    O campo 'level' DEVE ser exatamente: 'low', 'medium', 'high', ou 'critical'.
  `;

  try {
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
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            isSpecificWarningTriggered: { type: Type.BOOLEAN },
            liveWeather: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  temp: { type: Type.NUMBER },
                  precipitation: { type: Type.NUMBER },
                  condition: { type: Type.STRING }
                },
                required: ["time", "temp", "precipitation", "condition"]
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
                },
                required: ["time", "height", "type"]
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
                  cause: { type: Type.STRING, description: "Must be 'rain', 'tide', or 'both'" },
                  severity: { type: Type.STRING, description: "Must be 'moderate' or 'severe'" },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                },
                required: ["id", "date", "time", "areas", "cause", "severity", "lat", "lng"]
              }
            }
          },
          required: ["level", "title", "message", "recommendations", "isSpecificWarningTriggered", "liveWeather", "liveTides", "history"]
        }
      }
    });

    const text = response.text || '{}';
    const result = JSON.parse(text);
    
    // Extract grounding sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Fonte de Pesquisa',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { ...result, sources } as RiskAnalysis;
  } catch (error) {
    console.error("Erro ao analisar risco com Gemini Real-time:", error);
    throw error;
  }
};
