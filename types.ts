
export interface TideData {
  time: string;
  height: number;
  type: 'high' | 'low';
}

export interface WeatherData {
  time: string;
  temp: number;
  precipitation: number; // probability in %
  condition: string;
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
}

export interface RiskAnalysis {
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  recommendations: string[];
  isSpecificWarningTriggered: boolean;
  liveWeather: WeatherData[];
  liveTides: TideData[];
  sources: GroundingSource[];
  history: FloodHistory[];
}

export enum AlertLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
