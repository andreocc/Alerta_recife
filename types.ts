
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
  level: 'low' | 'medium' | 'high' | 'critical';
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

export interface RiskAnalysis {
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  recommendations: string[];
  isSpecificWarningTriggered: boolean;
  affectedNeighborhoods: string[];
  liveWeather: WeatherData[];
  liveTides: TideData[];
  sources: GroundingSource[];
  history: FloodHistory[];
  riskZones: RiskZone[];
  timeline: TimelineEvent[];
  lastUpdate: string;
}

export interface UserPreferences {
  savedAreas: { name: string; lat: number; lng: number }[];
}
