import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheManager } from '../services/cacheManager';

describe('CacheManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const store: Record<string, string> = {};
    localStorage.getItem = vi.fn((key: string) => store[key] ?? null);
    localStorage.setItem = vi.fn((key: string, value: string) => { store[key] = value; });
    localStorage.removeItem = vi.fn((key: string) => { delete store[key]; });
  });

  it('deve retornar null quando não há cache', () => {
    const cache = new CacheManager<{ level: string }>('test_v1', 10);
    const result = cache.get();
    expect(result).toBeNull();
  });

  it('deve retornar dados quando cache é válido', () => {
    const cache = new CacheManager<{ level: string }>('test_v1', 10);
    cache.set({ level: 'baixo' });
    const result = cache.get();
    expect(result).toEqual({ level: 'baixo' });
  });

  it('deve retornar dados stale mesmo expirados', () => {
    const cache = new CacheManager<{ level: string }>('test_v1', -1); // TTL negativo = sempre expirado
    cache.set({ level: 'medio' });
    // get() normal retorna null (expirado)
    expect(cache.get()).toBeNull();
    // getStale() retorna os dados mesmo expirados (fallback offline)
    expect(cache.getStale()).toEqual({ level: 'medio' });
  });

  it('deve retornar dados stale com getStale()', () => {
    const cache = new CacheManager<{ level: string }>('test_v1', 0);
    cache.set({ level: 'alto' });
    const stale = cache.getStale();
    expect(stale).toEqual({ level: 'alto' });
  });

  it('deve verificar se cache está expirado', () => {
    const cache = new CacheManager<{ level: string }>('test_v1', 10);
    cache.set({ level: 'baixo' });
    expect(cache.isStale()).toBe(false);
  });

  it('deve limpar o cache', () => {
    const cache = new CacheManager<{ level: string }>('test_v1', 10);
    cache.set({ level: 'critico' });
    cache.clear();
    expect(cache.get()).toBeNull();
  });
});
