/**
 * CacheManager — Gerenciador genérico de cache em localStorage.
 *
 * Usado por todos os serviços (weather, tide, risk) para evitar
 * chamadas desnecessárias e funcionar offline (PWA).
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheManager<T> {
  private key: string;
  private ttlMs: number;

  constructor(key: string, ttlMinutes: number = 10) {
    this.key = key;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /** Recupera dados do cache. Retorna null se não existir, estiver expirado ou corrompido. */
  get(): T | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);

      if (!entry || typeof entry.timestamp !== 'number' || entry.data === undefined) {
        console.warn(`[Cache:${this.key}] Estrutura inválida, removendo`);
        localStorage.removeItem(this.key);
        return null;
      }

      if (this.isStale()) {
        console.log(`[Cache:${this.key}] Expirado (${this.ttlMs / 60000}min)`);
        return null;
      }

      return entry.data;
    } catch (err) {
      console.error(`[Cache:${this.key}] Erro ao ler:`, err);
      localStorage.removeItem(this.key);
      return null;
    }
  }

  /** Retorna os dados mesmo se estiverem expirados (fallback offline). */
  getStale(): T | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry?.data ?? null;
    } catch {
      return null;
    }
  }

  /** Salva dados no cache. Se os dados forem inválidos, não salva. */
  set(data: T): void {
    if (data === null || data === undefined) {
      console.warn(`[Cache:${this.key}] Dados inválidos, ignorando`);
      return;
    }
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      localStorage.setItem(this.key, JSON.stringify(entry));
    } catch (err) {
      console.error(`[Cache:${this.key}] Erro ao salvar (quota?):`, err);
      // Falha silenciosa — cache é opcional
    }
  }

  /** Verifica se o cache está expirado. */
  isStale(): boolean {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return true;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return Date.now() - entry.timestamp > this.ttlMs;
    } catch {
      return true;
    }
  }

  /** Remove este cache. */
  clear(): void {
    localStorage.removeItem(this.key);
  }

  /** Retorna a idade do cache em minutos, ou Infinity se não existir. */
  age(): number {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return Infinity;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return (Date.now() - entry.timestamp) / 60000;
    } catch {
      return Infinity;
    }
  }
}
