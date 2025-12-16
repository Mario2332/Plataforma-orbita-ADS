/**
 * Sistema de cache em memória para reduzir chamadas ao backend
 * Melhora significativamente o tempo de carregamento após a primeira visita
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos padrão

  /**
   * Obtém um item do cache
   * @param key Chave do cache
   * @returns Dados ou null se expirado/inexistente
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Armazena um item no cache
   * @param key Chave do cache
   * @param data Dados a armazenar
   * @param ttl Tempo de vida em ms (opcional)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
    });
  }

  /**
   * Remove um item do cache
   * @param key Chave do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Remove todos os itens que começam com um prefixo
   * @param prefix Prefixo das chaves a remover
   */
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Verifica se uma chave existe e está válida
   * @param key Chave do cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Obtém dados do cache ou executa a função para buscar
   * @param key Chave do cache
   * @param fetcher Função para buscar dados se não estiver em cache
   * @param ttl Tempo de vida em ms (opcional)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] Hit: ${key}`);
      return cached;
    }

    console.log(`[Cache] Miss: ${key}, fetching...`);
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Instância global do cache
export const cache = new MemoryCache();

// Chaves de cache padronizadas
export const CACHE_KEYS = {
  // Aluno
  ALUNO_ME: 'aluno:me',
  ALUNO_DASHBOARD: 'aluno:dashboard',
  ALUNO_ESTUDOS: 'aluno:estudos',
  ALUNO_SIMULADOS: 'aluno:simulados',
  ALUNO_HORARIOS: 'aluno:horarios',
  ALUNO_TEMPLATES: 'aluno:templates',
  ALUNO_METAS: 'aluno:metas',
  ALUNO_PROGRESSO: 'aluno:progresso',
  ALUNO_AUTODIAGNOSTICOS: 'aluno:autodiagnosticos',
  ALUNO_DIARIO: 'aluno:diario',
  
  // Mentor
  MENTOR_ME: 'mentor:me',
  MENTOR_ALUNOS: 'mentor:alunos',
  MENTOR_METRICAS: 'mentor:metricas',
  
  // Prefixo para dados de aluno específico (usado pelo mentor)
  MENTOR_ALUNO_DATA: (alunoId: string, collection: string) => 
    `mentor:aluno:${alunoId}:${collection}`,
};

// TTLs específicos por tipo de dado
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minuto - dados que mudam frequentemente
  MEDIUM: 5 * 60 * 1000,     // 5 minutos - padrão
  LONG: 15 * 60 * 1000,      // 15 minutos - dados mais estáveis
  VERY_LONG: 60 * 60 * 1000, // 1 hora - dados raramente alterados
};

/**
 * Invalida cache relacionado a estudos quando há alteração
 */
export function invalidateEstudosCache(): void {
  cache.delete(CACHE_KEYS.ALUNO_ESTUDOS);
  cache.delete(CACHE_KEYS.ALUNO_DASHBOARD);
}

/**
 * Invalida cache relacionado a simulados quando há alteração
 */
export function invalidateSimuladosCache(): void {
  cache.delete(CACHE_KEYS.ALUNO_SIMULADOS);
  cache.delete(CACHE_KEYS.ALUNO_DASHBOARD);
}

/**
 * Invalida cache relacionado a horários/cronograma quando há alteração
 */
export function invalidateHorariosCache(): void {
  cache.delete(CACHE_KEYS.ALUNO_HORARIOS);
  cache.delete(CACHE_KEYS.ALUNO_TEMPLATES);
}

/**
 * Invalida cache relacionado a metas quando há alteração
 */
export function invalidateMetasCache(): void {
  cache.delete(CACHE_KEYS.ALUNO_METAS);
  cache.delete(CACHE_KEYS.ALUNO_DASHBOARD);
}

/**
 * Invalida todo o cache do aluno (usado no logout ou troca de usuário)
 */
export function invalidateAllAlunoCache(): void {
  cache.deleteByPrefix('aluno:');
}

/**
 * Invalida todo o cache do mentor
 */
export function invalidateAllMentorCache(): void {
  cache.deleteByPrefix('mentor:');
}
