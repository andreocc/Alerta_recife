import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TideChart } from '../components/TideChart';
import { TideData } from '../types';

describe('TideChart', () => {
  const mockData: TideData[] = [
    { time: '00:00', height: 1.2, type: 'low' },
    { time: '06:00', height: 2.5, type: 'high' },
    { time: '12:00', height: 1.8, type: 'low' },
    { time: '18:00', height: 2.8, type: 'high' },
  ];

  it('renders loading state when loading is true', () => {
    const { container } = render(<TideChart data={[]} loading={true} />);
    // Loading state mostra apenas skeleton, sem título
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    // O título "Tábua de Marés" NÃO aparece durante loading
    expect(screen.queryByText(/Tábua de Marés/i)).not.toBeInTheDocument();
  });

  it('renders nothing when no data and not loading', () => {
    const { container } = render(<TideChart data={[]} loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders chart when data provided and not loading', () => {
    const { container } = render(<TideChart data={mockData} loading={false} />);
    // Verifica o título
    expect(screen.getByText(/Tábua de Marés/i)).toBeInTheDocument();
    // Verifica que o container do gráfico Recharts existe
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
    // Nota: labels do eixo X (ex: '00:00') não são renderizadas em jsdom (0x0),
    // mas funcionam corretamente no navegador.
  });
});
