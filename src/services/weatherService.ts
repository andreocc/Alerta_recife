/**
 * WeatherService — Previsão do tempo via Open-Meteo (gratuita, sem chave).
 *
 * Usa a API pública Open-Meteo para obter precipitação, temperatura e
 * condições climáticas para Recife. Cache de 10 minutos.
 *
 * Docs: https://open-meteo.com/en/docs
 */

import { CacheManager } from './cacheManager';
import type { WeatherData } from '../types';

// ── Constantes ──────────────────────────────────────────────
const RECIFE_LAT = -8.0578;
const RECIFE_LNG = -34.8829;

const WEATHER_API_URL = (() => {
  const params = new URLSearchParams({
    latitude: String(RECIFE_LAT),
    longitude: String(RECIFE_LNG),
    hourly: 'precipitation,temperature_2m,weather_code',
    timezone: 'America/Recife',
    forecast_days: '2',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
})();

const cache = new CacheManager<WeatherData[]>('weather_recife_v1', 10);

// ── Tabela WMO Weather Codes → descrição em português ──────
const WMO_CONDITIONS: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Parcialmente nublado',
  2: 'Nublado',
  3: 'Encoberto',
  45: 'Neblina',
  48: 'Neblina com geada',
  51: 'Garoa leve',
  53: 'Garoa moderada',
  55: 'Garoa densa',
  56: 'Garoa congelante leve',
  57: 'Garoa congelante densa',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante leve',
  67: 'Chuva congelante forte',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva leves',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva violentas',
  85: 'Neve fraca',
  86: 'Neve forte',
  95: 'Trovoada',
  96: 'Trovoada com granizo leve',
  99: 'Trovoada com granizo forte',
};

function getCondition(code: number): string {
  return WMO_CONDITIONS[code] ?? 'Indefinido';
}

// ── Parsing da resposta Open-Meteo ─────────────────────────

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    precipitation: number[];
    temperature_2m: number[];
    weather_code: number[];
  };
}

function parseResponse(data: OpenMeteoResponse): WeatherData[] {
  const { time, precipitation, temperature_2m, weather_code } = data.hourly;

  return time.map((t, i) => ({
    time: t.substring(11, 16), // Extrai "HH:mm" de "2024-01-01T00:00"
    temp: Math.round(temperature_2m[i]),
    precipitation: Math.round(precipitation[i] * 10) / 10, // 1 casa decimal
    condition: getCondition(weather_code[i]),
  }));
}

// ── API pública ────────────────────────────────────────────

/**
 * Busca previsão do tempo horária para Recife (48h).
 *
 * @returns Array de WeatherData (48 itens, um por hora).
 *          Retorna array vazio se a API falhar e não houver cache.
 */
export async function fetchWeatherForecast(): Promise<WeatherData[]> {
  // Check cache first
  const cached = cache.get();
  if (cached) return cached;

  try {
    const response = await fetch(WEATHER_API_URL);

    if (!response.ok) {
      throw new Error(`Open-Meteo retornou HTTP ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();

    if (!data?.hourly?.time?.length) {
      throw new Error('Resposta da Open-Meteo sem dados horários');
    }

    const forecast = parseResponse(data);

    if (forecast.length === 0) {
      throw new Error('Nenhum dado de previsão após parsing');
    }

    cache.set(forecast);
    return forecast;
  } catch (err) {
    console.error('[WeatherService] Erro ao buscar previsão:', err);

    // Fallback: retornar cache expirado se existir
    const stale = cache.getStale();
    if (stale && stale.length > 0) {
      console.warn('[WeatherService] Usando cache expirado como fallback');
      return stale;
    }

    return [];
  }
}

export { RECIFE_LAT, RECIFE_LNG };
