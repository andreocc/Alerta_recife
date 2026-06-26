import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusCard } from '../components/StatusCard';
import { RiskAnalysis } from '../types';

const createMockAnalysis = (level: RiskAnalysis['level']): RiskAnalysis => ({
  level,
  breakdown: {
    meteorological: level,
    hydrological: level,
    geotechnical: level,
  },
  summary: {
    what: 'Test what',
    where: 'Test where',
    actions: ['Action 1', 'Action 2'],
  },
  title: 'Test Title',
  message: 'Test message',
  technicalDetails: 'Test technical details',
  recommendations: {
    general: ['General tip'],
    slopes: ['Slope tip'],
    plains: ['Plain tip'],
  },
  affectedNeighborhoods: ['Bairro Test'],
  liveWeather: [],
  liveTides: [],
  sources: [],
  history: [],
  riskZones: [],
  timeline: [],
  lastUpdate: '17/03/2026 às 10:00',
});

describe('StatusCard', () => {
  it('renders without crashing', () => {
    const analysis = createMockAnalysis('baixo');
    render(<StatusCard analysis={analysis} loading={false} />);
    expect(screen.getByText(/Test what/i)).toBeInTheDocument();
  });

  it('displays correct label for each risk level', () => {
    const levels: Array<RiskAnalysis['level']> = ['baixo', 'médio', 'alto', 'crítico', 'extremo'];
    levels.forEach(level => {
      const analysis = createMockAnalysis(level);
      const { unmount } = render(<StatusCard analysis={analysis} loading={false} />);
      const labelMap: Record<string, string> = {
        baixo: 'NORMALIDADE',
        médio: 'ATENÇÃO',
        alto: 'ALERTA',
        crítico: 'PERIGO REAL',
        extremo: 'EMERGÊNCIA',
      };
      expect(screen.getByText(new RegExp(labelMap[level]))).toBeInTheDocument();
      unmount();
    });
  });

  it('shows actions list', () => {
    const analysis = createMockAnalysis('alto');
    render(<StatusCard analysis={analysis} loading={false} />);
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(<StatusCard analysis={null} loading={true} />);
    // Skeleton should be rendered; we check that analysis content is not present
    expect(screen.queryByText(/Test what/i)).not.toBeInTheDocument();
  });
});
