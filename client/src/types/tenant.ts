/**
 * Configuração de Tenant para arquitetura multi-tenant
 * Permite personalização white-label por cliente
 */

export interface TenantFeatures {
  // Funcionalidades principais
  estudos: boolean;
  cronograma: boolean;
  cronogramaDinamico: boolean;
  metricas: boolean;
  metas: boolean;
  simulados: boolean;
  redacoes: boolean;
  diarioBordo: boolean;
  planoAcao: boolean;
  autodiagnostico: boolean;
  
  // Funcionalidades de mentoria
  mentoria: boolean;
  
  // Funcionalidades premium
  relatoriosAvancados: boolean;
  exportacaoPDF: boolean;
  integracaoCalendario: boolean;
}

export interface TenantBranding {
  // Identidade visual
  logo: string;
  logoSmall?: string;
  favicon?: string;
  
  // Cores principais (formato hex)
  corPrimaria: string;      // Ex: "#10b981" (emerald-500)
  corPrimariaHover: string; // Ex: "#059669" (emerald-600)
  corSecundaria: string;    // Ex: "#14b8a6" (teal-500)
  
  // Textos
  nomeExibicao: string;     // Nome exibido na plataforma
  descricao?: string;       // Descrição curta
  
  // Links de suporte
  urlSuporte?: string;
  emailSuporte?: string;
}

export interface TenantAds {
  // Configuração de anúncios
  exibirAnuncios: boolean;
  googleAdsClientId?: string;  // ca-pub-XXXXXXXXXXXXXXXX
  
  // Slots de anúncios específicos
  slots?: {
    header?: string;      // Slot ID para banner no header
    sidebar?: string;     // Slot ID para sidebar
    inContent?: string;   // Slot ID para entre conteúdo
    footer?: string;      // Slot ID para footer
  };
}

export interface TenantConfig {
  // Identificação
  id: string;
  slug: string;           // URL-friendly identifier
  
  // Domínios associados
  dominios: string[];     // ["clienteA.com.br", "app.clienteA.com.br"]
  dominioPrincipal: string;
  
  // Plano e status
  plano: 'free' | 'premium' | 'white-label';
  status: 'ativo' | 'suspenso' | 'trial';
  dataExpiracao?: Date;
  
  // Configurações
  branding: TenantBranding;
  features: TenantFeatures;
  ads: TenantAds;
  
  // Metadados
  criadoEm: Date;
  atualizadoEm: Date;
}

// Configuração padrão para novos tenants
export const DEFAULT_TENANT_CONFIG: Omit<TenantConfig, 'id' | 'slug' | 'dominios' | 'dominioPrincipal' | 'criadoEm' | 'atualizadoEm'> = {
  plano: 'free',
  status: 'ativo',
  branding: {
    logo: '/logo.png',
    corPrimaria: '#10b981',
    corPrimariaHover: '#059669',
    corSecundaria: '#14b8a6',
    nomeExibicao: 'Plataforma Órbita',
  },
  features: {
    estudos: true,
    cronograma: true,
    cronogramaDinamico: true,
    metricas: true,
    metas: true,
    simulados: true,
    redacoes: true,
    diarioBordo: true,
    planoAcao: true,
    autodiagnostico: true,
    mentoria: true,
    relatoriosAvancados: false,
    exportacaoPDF: false,
    integracaoCalendario: false,
  },
  ads: {
    exibirAnuncios: true,
    googleAdsClientId: undefined,
  },
};

// Configuração para plano white-label (sem anúncios, todas features)
export const WHITE_LABEL_FEATURES: TenantFeatures = {
  estudos: true,
  cronograma: true,
  cronogramaDinamico: true,
  metricas: true,
  metas: true,
  simulados: true,
  redacoes: true,
  diarioBordo: true,
  planoAcao: true,
  autodiagnostico: true,
  mentoria: true,
  relatoriosAvancados: true,
  exportacaoPDF: true,
  integracaoCalendario: true,
};

// Configuração para plano gratuito (com anúncios, features limitadas)
export const FREE_FEATURES: TenantFeatures = {
  estudos: true,
  cronograma: true,
  cronogramaDinamico: false,  // Premium only
  metricas: true,
  metas: true,
  simulados: true,
  redacoes: true,
  diarioBordo: true,
  planoAcao: false,           // Premium only
  autodiagnostico: true,
  mentoria: false,            // Premium only
  relatoriosAvancados: false,
  exportacaoPDF: false,
  integracaoCalendario: false,
};
