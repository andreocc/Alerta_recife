
export interface TideData {
  time: string;
  height: number;
  type: 'high' | 'low';
}

export interface WeatherData {
  time: string;
  temp: number;
  precipitation: number;
  condition: string;
}

export interface RiskZone {
  id: string;
  name: string;
  level: RiskLevel;
  polygon: [number, number][];
  description: string;
}

export interface TimelineEvent {
  hour: string;
  riskType: 'rain' | 'tide' | 'combined';
  intensity: number; // 0-100
  label: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface FloodHistory {
  id: string;
  date: string;
  time: string;
  areas: string[];
  cause: 'rain' | 'tide' | 'both';
  severity: 'moderate' | 'severe';
  lat: number;
  lng: number;
  details?: string;
}

export type RiskLevel = 'baixo' | 'médio' | 'alto' | 'crítico' | 'extremo';

export interface RiskBreakdown {
  meteorological: RiskLevel; // Chuva
  hydrological: RiskLevel;    // Maré/Canais
  geotechnical: RiskLevel;    // Encostas/Barreiras
}

export interface RiskAnalysis {
  level: RiskLevel;
  breakdown: RiskBreakdown;
  summary: {
    what: string;      // O que está acontecendo?
    where: string;     // Onde exatamente?
    actions: string[]; // O que eu devo fazer agora? (3-5 ações)
  };
  title: string;
  message: string;
  technicalDetails: string;
  recommendations: {
    general: string[];
    slopes: string[]; // Morros
    plains: string[]; // Planícies/Litoral
  };
  affectedNeighborhoods: string[];
  liveWeather: WeatherData[];
  liveTides: TideData[];
  sources: GroundingSource[];
  history: FloodHistory[];
  riskZones: RiskZone[];
  timeline: TimelineEvent[];
  lastUpdate: string;
  isStale?: boolean;
}

export interface UserPreferences {
  savedAreas: { name: string; lat: number; lng: number }[];
}
