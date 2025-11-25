/**
 * Helpers para manipulação de datas respeitando timezone do Brasil (America/Sao_Paulo)
 */

/**
 * Converte um Timestamp do Firestore para Date
 */
export const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  // Se já é uma Date
  if (timestamp instanceof Date) return timestamp;
  
  // Se tem método toDate (Timestamp do Firestore)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Se tem _seconds ou seconds (formato serializado)
  if (timestamp._seconds || timestamp.seconds) {
    const seconds = timestamp._seconds || timestamp.seconds;
    const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds || 0;
    return new Date(seconds * 1000 + nanoseconds / 1000000);
  }
  
  // Se é string ISO
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  // Fallback
  return new Date();
};

/**
 * Converte uma Date para string no formato YYYY-MM-DD no timezone local
 * Evita problemas de conversão UTC que mudam a data
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Cria uma Date a partir de uma string YYYY-MM-DD considerando timezone local
 * Evita que "2024-11-24" vire "2024-11-23 21:00:00" (UTC-3)
 */
export const fromLocalDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Converte um Timestamp do Firestore para string YYYY-MM-DD no timezone local
 * Usado para preencher inputs type="date"
 */
export const timestampToInputDate = (timestamp: any): string => {
  const date = toDate(timestamp);
  return toLocalDateString(date);
};

/**
 * Formata uma data para exibição em português (DD/MM/YYYY)
 */
export const formatDateBR = (date: Date | any): string => {
  const d = toDate(date);
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
};

/**
 * Obtém a data de hoje no formato YYYY-MM-DD (timezone local)
 */
export const getTodayString = (): string => {
  return toLocalDateString(new Date());
};

/**
 * Adiciona dias a uma data e retorna no formato YYYY-MM-DD
 */
export const addDays = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return toLocalDateString(result);
};
