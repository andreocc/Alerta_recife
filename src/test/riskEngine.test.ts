import { describe, it, expect } from 'vitest';
import {
  precipitationToRisk,
  tideToRisk,
  precipitationAccumulatedToRisk,
  floodRisk,
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

  // ── Risco de alagamento (chuva + maré) ─────
  describe('floodRisk', () => {
    it('baixo + baixo = baixo', () => {
      expect(floodRisk('baixo', 'baixo')).toBe('baixo');
    });

    it('médio + baixo = baixo (sem combinação perigosa)', () => {
      expect(floodRisk('médio', 'baixo')).toBe('baixo');
    });

    it('baixo + médio = baixo (sem combinação perigosa)', () => {
      expect(floodRisk('baixo', 'médio')).toBe('baixo');
    });

    it('médio + médio = baixo (ambos médios não é suficiente)', () => {
      expect(floodRisk('médio', 'médio')).toBe('baixo');
    });

    it('alto + baixo = médio (chuva forte mas maré baixa — escoa)', () => {
      expect(floodRisk('alto', 'baixo')).toBe('médio');
    });

    it('baixo + alto = baixo (SEM CHUVA = SEM ALAGAMENTO)', () => {
      expect(floodRisk('baixo', 'alto')).toBe('baixo');
    });

    it('baixo + extremo = baixo (sem chuva, maré não importa)', () => {
      expect(floodRisk('baixo', 'extremo')).toBe('baixo');
    });

    it('alto + alto = crítico (AMBOS altos — combinação perigosa!)', () => {
      expect(floodRisk('alto', 'alto')).toBe('crítico');
    });

    it('crítico + alto = crítico (base=alto(2) + 1 = 3 = crítico)', () => {
      expect(floodRisk('crítico', 'alto')).toBe('crítico');
    });

    it('alto + crítico = crítico (simétrico, base=alto(2) + 1 = crítico)', () => {
      expect(floodRisk('alto', 'crítico')).toBe('crítico');
    });

    it('extremo + extremo = extremo (cap)', () => {
      expect(floodRisk('extremo', 'extremo')).toBe('extremo');
    });

    it('crítico + baixo = alto (chuva crítica mas maré baixa — escoa parcial)', () => {
      expect(floodRisk('crítico', 'baixo')).toBe('alto');
    });

    it('médio + crítico = médio (chuva média + maré muito alta)', () => {
      expect(floodRisk('médio', 'crítico')).toBe('médio');
    });

    it('médio + alto = baixo (chuva média + maré alta não é suficiente)', () => {
      expect(floodRisk('médio', 'alto')).toBe('baixo');
    });

    it('médio + baixo = baixo (chuva média + maré baixa)', () => {
      expect(floodRisk('médio', 'baixo')).toBe('baixo');
    });

    it('baixo + crítico = baixo (SEM CHUVA = SEM ALAGAMENTO, maré não importa)', () => {
      expect(floodRisk('baixo', 'crítico')).toBe('baixo');
    });
  });

  // ── Risco combinado geral ────────────────────
  describe('combinedRisk', () => {
    it('alagamento baixo + geo baixo = baixo', () => {
      expect(combinedRisk('baixo', 'baixo', 'baixo')).toBe('baixo');
    });

    it('alagamento crítico (chuva+maré) + geo baixo = crítico', () => {
      expect(combinedRisk('alto', 'alto', 'baixo')).toBe('crítico');
    });

    it('alagamento médio + geo alto (deslizamento) = alto', () => {
      expect(combinedRisk('alto', 'baixo', 'alto')).toBe('alto');
    });

    it('alagamento extremo + geo extremo = extremo', () => {
      expect(combinedRisk('crítico', 'alto', 'extremo')).toBe('extremo');
    });
  });
});

describe('riskEngine — templates', () => {
  it('gera template para nível baixo', () => {
    const t = getTemplate('baixo', 'baixo', 'baixo', 5, 1.2, '06:00', []);
    expect(t.title).toContain('Normalidade');
    expect(t.actions).toHaveLength(3);
  });

  it('gera template para nível alto com chuva+maré', () => {
    const t = getTemplate('alto', 'alto', 'alto', 45, 2.3, '14:00', ['Boa Viagem', 'Centro']);
    expect(t.title).toContain('ALERTA');
    expect(t.where).toContain('Boa Viagem');
    expect(t.what).toContain('45mm');
    expect(t.what).toContain('2.3m');
    expect(t.actions.length).toBeGreaterThanOrEqual(4);
  });

  it('gera template para nível alto com só chuva (sem maré)', () => {
    const t = getTemplate('alto', 'alto', 'baixo', 45, 1.2, '14:00', ['Boa Viagem']);
    expect(t.what).toContain('45mm');
    expect(t.what).not.toContain('COMBINADA');
  });

  it('gera template para nível extremo', () => {
    const t = getTemplate('extremo', 'extremo', 'extremo', 120, 3.2, '22:00', ['Boa Viagem']);
    expect(t.title).toContain('EMERGÊNCIA');
    expect(t.message).toContain('EVACUE');
    expect(t.actions.length).toBeGreaterThanOrEqual(5);
  });

  it('interpola dados corretamente (mm, m, hora)', () => {
    const t = getTemplate('médio', 'médio', 'médio', 22, 1.8, '08:00', ['Pina']);
    expect(t.technicalDetails).toContain('22mm');
    expect(t.technicalDetails).toContain('1.8m');
    expect(t.technicalDetails).toContain('08:00');
  });

  it('template menciona combinação apenas quando ambos altos', () => {
    const comCombinacao = getTemplate('alto', 'alto', 'alto', 40, 2.5, '10:00', ['Centro']);
    expect(comCombinacao.what).toContain('COMBINADA');

    const semCombinacao = getTemplate('alto', 'alto', 'baixo', 40, 1.0, '10:00', ['Centro']);
    expect(semCombinacao.what).not.toContain('COMBINADA');
  });
});
