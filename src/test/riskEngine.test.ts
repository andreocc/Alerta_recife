import { describe, it, expect } from 'vitest';
import {
  precipitationToRisk,
  tideToRisk,
  precipitationAccumulatedToRisk,
  combinedRisk,
  getTemplate,
} from '../services/riskEngine';

describe('riskEngine — thresholds', () => {
  // ── Precipitação ────────────────────────────
  describe('precipitationToRisk', () => {
    it('< 10mm → baixo', () => {
      expect(precipitationToRisk(0)).toBe('baixo');
      expect(precipitationToRisk(5)).toBe('baixo');
      expect(precipitationToRisk(9.9)).toBe('baixo');
    });

    it('10-30mm → médio', () => {
      expect(precipitationToRisk(10)).toBe('médio');
      expect(precipitationToRisk(20)).toBe('médio');
      expect(precipitationToRisk(29.9)).toBe('médio');
    });

    it('30-50mm → alto', () => {
      expect(precipitationToRisk(30)).toBe('alto');
      expect(precipitationToRisk(40)).toBe('alto');
    });

    it('50-100mm → crítico', () => {
      expect(precipitationToRisk(50)).toBe('crítico');
      expect(precipitationToRisk(75)).toBe('crítico');
    });

    it('> 100mm → extremo', () => {
      expect(precipitationToRisk(100)).toBe('extremo');
      expect(precipitationToRisk(200)).toBe('extremo');
    });
  });

  // ── Maré ────────────────────────────────────
  describe('tideToRisk', () => {
    it('< 1.5m → baixo', () => {
      expect(tideToRisk(1.0)).toBe('baixo');
      expect(tideToRisk(1.4)).toBe('baixo');
    });

    it('1.5-2.0m → médio', () => {
      expect(tideToRisk(1.5)).toBe('médio');
      expect(tideToRisk(1.9)).toBe('médio');
    });

    it('2.0-2.5m → alto', () => {
      expect(tideToRisk(2.0)).toBe('alto');
      expect(tideToRisk(2.3)).toBe('alto');
    });

    it('2.5-3.0m → crítico', () => {
      expect(tideToRisk(2.5)).toBe('crítico');
      expect(tideToRisk(2.9)).toBe('crítico');
    });

    it('> 3.0m → extremo', () => {
      expect(tideToRisk(3.0)).toBe('extremo');
      expect(tideToRisk(3.5)).toBe('extremo');
    });
  });

  // ── Risco combinado ─────────────────────────
  describe('combinedRisk', () => {
    it('baixo + baixo + baixo = baixo', () => {
      expect(combinedRisk('baixo', 'baixo', 'baixo')).toBe('baixo');
    });

    it('médio + baixo + baixo = médio (max)', () => {
      expect(combinedRisk('médio', 'baixo', 'baixo')).toBe('médio');
    });

    it('alto + médio + baixo = alto (max, só 1 ≥ alto, sem bump)', () => {
      expect(combinedRisk('alto', 'médio', 'baixo')).toBe('alto');
    });

    it('alto + alto + baixo = crítico (2+ ≥ alto, incrementa)', () => {
      expect(combinedRisk('alto', 'alto', 'baixo')).toBe('crítico');
    });

    it('alto + alto + alto = crítico (inc, cap não atingido)', () => {
      expect(combinedRisk('alto', 'alto', 'alto')).toBe('crítico');
    });

    it('extremo + extremo + extremo = extremo (cap)', () => {
      expect(combinedRisk('extremo', 'extremo', 'extremo')).toBe('extremo');
    });

    it('crítico + médio + baixo = crítico (max, 1 médio não incrementa)', () => {
      expect(combinedRisk('crítico', 'médio', 'baixo')).toBe('crítico');
    });
  });
});

describe('riskEngine — templates', () => {
  it('gera template para nível baixo', () => {
    const t = getTemplate('baixo', 5, 1.2, '06:00', []);
    expect(t.title).toContain('Normalidade');
    expect(t.actions).toHaveLength(3);
  });

  it('gera template para nível alto com bairros', () => {
    const t = getTemplate('alto', 45, 2.3, '14:00', ['Boa Viagem', 'Centro']);
    expect(t.title).toContain('ALERTA');
    expect(t.where).toContain('Boa Viagem');
    expect(t.what).toContain('45mm');
    expect(t.what).toContain('2.3m');
    expect(t.actions.length).toBeGreaterThanOrEqual(4);
  });

  it('gera template para nível extremo', () => {
    const t = getTemplate('extremo', 120, 3.2, '22:00', ['Boa Viagem']);
    expect(t.title).toContain('EMERGÊNCIA');
    expect(t.message).toContain('EVACUE');
    expect(t.actions.length).toBeGreaterThanOrEqual(5);
  });

  it('interpola dados corretamente (mm, m, hora)', () => {
    const t = getTemplate('médio', 22, 1.8, '08:00', ['Pina']);
    expect(t.technicalDetails).toContain('22mm');
    expect(t.technicalDetails).toContain('1.8m');
    expect(t.technicalDetails).toContain('08:00');
  });
});
