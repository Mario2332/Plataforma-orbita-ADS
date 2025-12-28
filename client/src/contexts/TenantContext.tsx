import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, currentProject, isFreePlan, isWhiteLabel } from '@/lib/firebase';
import { TenantConfig, DEFAULT_TENANT_CONFIG } from '@/types/tenant';

interface TenantContextType {
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  
  // Informações do projeto Firebase
  firebaseProject: string;
  isFreePlan: boolean;
  isWhiteLabel: boolean;
  
  // Helpers
  hasFeature: (feature: keyof TenantConfig['features']) => boolean;
  shouldShowAds: () => boolean;
  getPrimaryColor: () => string;
  getSecondaryColor: () => string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Configuração padrão para plataforma-orbita (White-label)
const getDefaultTenantOrbita = (): TenantConfig => ({
  id: 'default',
  slug: 'orbita',
  dominios: ['localhost', 'plataforma-orbita.web.app', 'plataforma-orbita.firebaseapp.com'],
  dominioPrincipal: 'plataforma-orbita.web.app',
  plano: 'white-label',
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
    relatoriosAvancados: true,
    exportacaoPDF: true,
    integracaoCalendario: true,
  },
  ads: {
    exibirAnuncios: false,
  },
  criadoEm: new Date(),
  atualizadoEm: new Date(),
});

// Configuração padrão para orbita-free (Gratuito com anúncios)
const getDefaultTenantFree = (): TenantConfig => ({
  id: 'orbita-free',
  slug: 'orbita-free',
  dominios: ['orbita-free.web.app', 'orbita-free.firebaseapp.com', 'orbitafree.com.br'],
  dominioPrincipal: 'orbita-free.web.app',
  plano: 'free',
  status: 'ativo',
  branding: {
    logo: '/logo.png',
    corPrimaria: '#10b981',
    corPrimariaHover: '#059669',
    corSecundaria: '#14b8a6',
    nomeExibicao: 'Órbita Estudos',
  },
  features: {
    estudos: true,
    cronograma: true,
    cronogramaDinamico: false, // Premium
    metricas: true,
    metas: true,
    simulados: true,
    redacoes: true,
    diarioBordo: true,
    planoAcao: false, // Premium
    autodiagnostico: false, // Premium
    mentoria: false, // Premium
    relatoriosAvancados: false, // Premium
    exportacaoPDF: false, // Premium
    integracaoCalendario: false, // Premium
  },
  ads: {
    exibirAnuncios: true,
    googleAdsClientId: '', // Será preenchido após aprovação do AdSense
    slots: {
      header: '',
      sidebar: '',
      inContent: '',
      footer: '',
    },
  },
  criadoEm: new Date(),
  atualizadoEm: new Date(),
});

// Retorna configuração padrão baseada no projeto Firebase
const getDefaultTenant = (): TenantConfig => {
  if (isFreePlan) {
    return getDefaultTenantFree();
  }
  return getDefaultTenantOrbita();
};

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        setIsLoading(true);
        setError(null);

        const hostname = window.location.hostname;
        console.log('[Tenant] Projeto Firebase:', currentProject);
        console.log('[Tenant] Detectando tenant para domínio:', hostname);

        // Tentar buscar tenant pelo domínio no Firestore
        const tenantsRef = collection(db, 'tenants');
        const q = query(tenantsRef, where('dominios', 'array-contains', hostname));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const tenantDoc = querySnapshot.docs[0];
          const tenantData = tenantDoc.data() as TenantConfig;
          console.log('[Tenant] Tenant encontrado:', tenantData.branding.nomeExibicao);
          setTenant({
            ...tenantData,
            id: tenantDoc.id,
          });
        } else {
          // Fallback para configuração padrão baseada no projeto
          console.log('[Tenant] Nenhum tenant encontrado, usando padrão para', currentProject);
          setTenant(getDefaultTenant());
        }
      } catch (err) {
        console.error('[Tenant] Erro ao carregar tenant:', err);
        setError('Erro ao carregar configurações');
        // Usar configuração padrão em caso de erro
        setTenant(getDefaultTenant());
      } finally {
        setIsLoading(false);
      }
    }

    loadTenant();
  }, []);

  // Aplicar cores CSS customizadas quando tenant carregar
  useEffect(() => {
    if (tenant?.branding) {
      const root = document.documentElement;
      
      const { corPrimaria, corPrimariaHover, corSecundaria } = tenant.branding;
      
      // Função para converter hex para oklch (aproximação)
      const hexToOklch = (hex: string, lightnessAdjust: number = 0): string => {
        // Remove # se presente
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
        const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
        
        // Conversão simplificada para oklch
        const l = Math.min(1, Math.max(0, (0.2126 * r + 0.7152 * g + 0.0722 * b) * 0.8 + 0.2 + lightnessAdjust));
        const c = Math.sqrt(Math.pow(r - (r+g+b)/3, 2) + Math.pow(g - (r+g+b)/3, 2) + Math.pow(b - (r+g+b)/3, 2)) * 0.5;
        const h = Math.atan2(b - g, r - g) * (180 / Math.PI);
        
        return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${((h + 360) % 360).toFixed(0)})`;
      };
      
      // Aplicar como variáveis CSS customizadas (hex direto)
      root.style.setProperty('--tenant-primary', corPrimaria);
      root.style.setProperty('--tenant-primary-hover', corPrimariaHover);
      root.style.setProperty('--tenant-secondary', corSecundaria);
      
      // Aplicar cor primária em OKLCH para variáveis do sistema
      const oklchPrimary = hexToOklch(corPrimaria);
      const oklchPrimaryHover = hexToOklch(corPrimariaHover);
      const oklchPrimaryLight = hexToOklch(corPrimaria, 0.35); // Versão mais clara
      const oklchPrimaryVeryLight = hexToOklch(corPrimaria, 0.45); // Versão muito clara
      
      // Sidebar
      root.style.setProperty('--sidebar-accent', oklchPrimary);
      root.style.setProperty('--sidebar-accent-foreground', 'oklch(0.98 0 0)');
      root.style.setProperty('--sidebar-primary', oklchPrimary);
      root.style.setProperty('--sidebar-primary-foreground', 'oklch(0.98 0 0)');
      root.style.setProperty('--sidebar-ring', oklchPrimary);
      root.style.setProperty('--sidebar-hover', oklchPrimaryVeryLight);
      
      // Cores primárias do sistema (botões, links, etc.)
      root.style.setProperty('--primary', oklchPrimary);
      root.style.setProperty('--primary-foreground', 'oklch(0.98 0 0)');
      root.style.setProperty('--ring', oklchPrimary);
      
      // Charts
      root.style.setProperty('--chart-1', oklchPrimaryLight);
      root.style.setProperty('--chart-2', oklchPrimary);
      root.style.setProperty('--chart-3', oklchPrimaryHover);
      
      // Injetar CSS dinâmico para classes Tailwind que usam emerald
      const styleId = 'tenant-dynamic-styles';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        /* ===== BACKGROUNDS ===== */
        .bg-emerald-50 { background-color: ${corPrimaria}10 !important; }
        .bg-emerald-100 { background-color: ${corPrimaria}18 !important; }
        .bg-emerald-200 { background-color: ${corPrimaria}25 !important; }
        .bg-emerald-300 { background-color: ${corPrimaria}40 !important; }
        .bg-emerald-400 { background-color: ${corPrimaria}cc !important; }
        .bg-emerald-500 { background-color: ${corPrimaria} !important; }
        .bg-emerald-600 { background-color: ${corPrimariaHover} !important; }
        .bg-emerald-700 { background-color: ${corPrimariaHover} !important; }
        
        /* Backgrounds com opacidade */
        .bg-emerald-50\\/50 { background-color: ${corPrimaria}08 !important; }
        .bg-emerald-100\\/50 { background-color: ${corPrimaria}0c !important; }
        .bg-emerald-900\\/10 { background-color: ${corPrimaria}1a !important; }
        .bg-emerald-900\\/20 { background-color: ${corPrimaria}33 !important; }
        .bg-emerald-900\\/30 { background-color: ${corPrimaria}4d !important; }
        
        /* ===== HOVER BACKGROUNDS ===== */
        .hover\\:bg-emerald-50:hover { background-color: ${corPrimaria}15 !important; }
        .hover\\:bg-emerald-100:hover { background-color: ${corPrimaria}20 !important; }
        .hover\\:bg-emerald-200:hover { background-color: ${corPrimaria}30 !important; }
        .hover\\:bg-emerald-500:hover { background-color: ${corPrimaria} !important; }
        .hover\\:bg-emerald-600:hover { background-color: ${corPrimariaHover} !important; }
        .hover\\:bg-emerald-700:hover { background-color: ${corPrimariaHover} !important; }
        .hover\\:bg-emerald-900\\/20:hover { background-color: ${corPrimaria}33 !important; }
        .hover\\:bg-emerald-900\\/30:hover { background-color: ${corPrimaria}4d !important; }
        
        /* ===== TEXT COLORS ===== */
        .text-emerald-300 { color: ${corPrimaria}99 !important; }
        .text-emerald-400 { color: ${corSecundaria} !important; }
        .text-emerald-500 { color: ${corPrimaria} !important; }
        .text-emerald-600 { color: ${corPrimaria} !important; }
        .text-emerald-700 { color: ${corPrimariaHover} !important; }
        .text-emerald-800 { color: ${corPrimariaHover} !important; }
        .text-emerald-900 { color: ${corPrimariaHover} !important; }
        
        /* Hover text */
        .hover\\:text-emerald-500:hover { color: ${corPrimaria} !important; }
        .hover\\:text-emerald-600:hover { color: ${corPrimaria} !important; }
        .hover\\:text-emerald-700:hover { color: ${corPrimariaHover} !important; }
        
        /* ===== BORDERS ===== */
        .border-emerald-100 { border-color: ${corPrimaria}20 !important; }
        .border-emerald-200 { border-color: ${corPrimaria}30 !important; }
        .border-emerald-300 { border-color: ${corPrimaria}40 !important; }
        .border-emerald-400 { border-color: ${corPrimaria}60 !important; }
        .border-emerald-500 { border-color: ${corPrimaria} !important; }
        .border-emerald-600 { border-color: ${corPrimaria} !important; }
        .border-emerald-700 { border-color: ${corPrimariaHover} !important; }
        .border-emerald-800 { border-color: ${corPrimariaHover} !important; }
        .border-emerald-800\\/50 { border-color: ${corPrimariaHover}80 !important; }
        
        /* Hover borders */
        .hover\\:border-emerald-300:hover { border-color: ${corPrimaria}40 !important; }
        .hover\\:border-emerald-500:hover { border-color: ${corPrimaria} !important; }
        
        /* Focus borders */
        .focus\\:border-emerald-500:focus { border-color: ${corPrimaria} !important; }
        .focus\\:border-emerald-600:focus { border-color: ${corPrimaria} !important; }
        
        /* ===== RING ===== */
        .ring-emerald-200 { --tw-ring-color: ${corPrimaria}30 !important; }
        .ring-emerald-300 { --tw-ring-color: ${corPrimaria}40 !important; }
        .ring-emerald-500 { --tw-ring-color: ${corPrimaria} !important; }
        .ring-emerald-600 { --tw-ring-color: ${corPrimaria} !important; }
        .ring-emerald-800 { --tw-ring-color: ${corPrimariaHover}80 !important; }
        .focus\\:ring-emerald-500:focus { --tw-ring-color: ${corPrimaria} !important; }
        
        /* ===== GRADIENTS ===== */
        .from-emerald-400 { --tw-gradient-from: ${corPrimaria}cc !important; }
        .from-emerald-500 { --tw-gradient-from: ${corPrimaria} !important; }
        .from-emerald-600 { --tw-gradient-from: ${corPrimariaHover} !important; }
        .via-emerald-500 { --tw-gradient-via: ${corPrimaria} !important; }
        .via-emerald-600 { --tw-gradient-via: ${corPrimariaHover} !important; }
        .to-emerald-400 { --tw-gradient-to: ${corPrimaria}cc !important; }
        .to-emerald-500 { --tw-gradient-to: ${corPrimaria} !important; }
        .to-emerald-600 { --tw-gradient-to: ${corPrimariaHover} !important; }
        
        /* ===== TEAL (SECONDARY) ===== */
        .bg-teal-50 { background-color: ${corSecundaria}15 !important; }
        .bg-teal-100 { background-color: ${corSecundaria}20 !important; }
        .bg-teal-500 { background-color: ${corSecundaria} !important; }
        .bg-teal-600 { background-color: ${corSecundaria} !important; }
        .text-teal-500 { color: ${corSecundaria} !important; }
        .text-teal-600 { color: ${corSecundaria} !important; }
        .border-teal-500 { border-color: ${corSecundaria} !important; }
        .from-teal-500 { --tw-gradient-from: ${corSecundaria} !important; }
        .to-teal-500 { --tw-gradient-to: ${corSecundaria} !important; }
        
        /* ===== TABS & DATA-STATE ===== */
        [data-state="active"].bg-emerald-500 { background-color: ${corPrimaria} !important; }
        [data-state="active"].data-\\[state\\=active\\]\\:bg-emerald-500 { background-color: ${corPrimaria} !important; }
        .data-\\[state\\=active\\]\\:bg-emerald-500[data-state="active"] { background-color: ${corPrimaria} !important; }
        
        /* ===== DARK MODE ===== */
        .dark .bg-emerald-50 { background-color: ${corPrimaria}15 !important; }
        .dark .bg-emerald-100 { background-color: ${corPrimaria}20 !important; }
        .dark .bg-emerald-900\\/10 { background-color: ${corPrimaria}1a !important; }
        .dark .bg-emerald-900\\/20 { background-color: ${corPrimaria}33 !important; }
        .dark .bg-emerald-900\\/30 { background-color: ${corPrimaria}4d !important; }
        .dark .text-emerald-300 { color: ${corPrimaria}99 !important; }
        .dark .text-emerald-400 { color: ${corSecundaria} !important; }
        .dark .border-emerald-700 { border-color: ${corPrimaria}60 !important; }
        .dark .border-emerald-800 { border-color: ${corPrimaria}40 !important; }
        .dark .border-emerald-800\\/50 { border-color: ${corPrimaria}30 !important; }
        .dark .ring-emerald-800 { --tw-ring-color: ${corPrimaria}60 !important; }
        .dark .hover\\:bg-emerald-900\\/20:hover { background-color: ${corPrimaria}33 !important; }
        .dark .hover\\:bg-emerald-900\\/30:hover { background-color: ${corPrimaria}4d !important; }
        
        /* ===== SHADOW ===== */
        .shadow-emerald-500\\/20 { --tw-shadow-color: ${corPrimaria}33 !important; }
        .shadow-emerald-500\\/25 { --tw-shadow-color: ${corPrimaria}40 !important; }
        .hover\\:shadow-emerald-500\\/30:hover { --tw-shadow-color: ${corPrimaria}4d !important; }
        
        /* ===== DIVIDE ===== */
        .divide-emerald-200 > :not([hidden]) ~ :not([hidden]) { border-color: ${corPrimaria}30 !important; }
        
        /* ===== PLACEHOLDER ===== */
        .placeholder-emerald-400::placeholder { color: ${corSecundaria} !important; }
        
        /* ===== ACCENT ===== */
        .accent-emerald-500 { accent-color: ${corPrimaria} !important; }
        .accent-emerald-600 { accent-color: ${corPrimaria} !important; }
        
        /* ===== CONTRASTE - TEXTO ESCURO EM FUNDOS CLAROS ===== */
        /* Quando o fundo é claro (50-200), o texto deve ser escuro para legibilidade */
        .bg-emerald-50 .text-emerald-600,
        .bg-emerald-50 .text-emerald-500,
        .bg-emerald-100 .text-emerald-600,
        .bg-emerald-100 .text-emerald-500 { color: ${corPrimariaHover} !important; }
        
        /* Headers em cards com fundo claro - usar cor escura */
        .bg-emerald-50 h1, .bg-emerald-50 h2, .bg-emerald-50 h3,
        .bg-emerald-100 h1, .bg-emerald-100 h2, .bg-emerald-100 h3,
        .bg-emerald-200 h1, .bg-emerald-200 h2, .bg-emerald-200 h3 { color: #1f2937 !important; }
        
        /* Texto em fundos claros deve ser escuro */
        .bg-emerald-50 p, .bg-emerald-100 p, .bg-emerald-200 p { color: #374151 !important; }
        
        /* Texto claro (300-400) em fundos claros - escurecer */
        .bg-emerald-50 .text-emerald-300,
        .bg-emerald-50 .text-emerald-400,
        .bg-emerald-100 .text-emerald-300,
        .bg-emerald-100 .text-emerald-400,
        .bg-emerald-50\\/50 .text-emerald-300,
        .bg-emerald-50\\/50 .text-emerald-400 { color: ${corPrimariaHover} !important; }
        
        /* Garantir que texto branco em fundos escuros (500+) */
        .bg-emerald-500 .text-white,
        .bg-emerald-600 .text-white,
        .bg-emerald-700 .text-white { color: white !important; }
        
        /* Texto em fundos claros - forcar escuro para legibilidade */
        .bg-emerald-50 span:not(.text-white),
        .bg-emerald-100 span:not(.text-white),
        .bg-emerald-50\\/50 span:not(.text-white) { color: #374151 !important; }
        
        /* Excecao: icones e badges podem manter cor */
        .bg-emerald-50 svg,
        .bg-emerald-100 svg,
        .bg-emerald-50\\/50 svg { color: ${corPrimaria} !important; }
        
        /* Cards com fundo claro - garantir texto legivel */
        [class*="bg-emerald-50"] [class*="text-emerald-"],
        [class*="bg-emerald-100"] [class*="text-emerald-"] {
          color: ${corPrimariaHover} !important;
        }
        
        /* Texto em fundos com opacidade baixa - escurecer */
        .bg-emerald-900\\/10 .text-emerald-300,
        .bg-emerald-900\\/10 .text-emerald-400,
        .bg-emerald-900\\/20 .text-emerald-300,
        .bg-emerald-900\\/20 .text-emerald-400 { color: ${corPrimaria} !important; }
        
        /* ===== SIDEBAR HOVER ===== */
        /* Fundo claro na sidebar quando hover - usar cor do tenant */
        .hover\\:bg-emerald-50:hover,
        .hover\\:bg-sidebar-accent:hover { background-color: ${corPrimaria}15 !important; }
        
        /* Sidebar footer e areas com fundo verde claro */
        .bg-sidebar-accent\\/50,
        .bg-emerald-50\\/30,
        .bg-emerald-50\\/20 { background-color: ${corPrimaria}12 !important; }
        
        /* Garantir que areas da sidebar usem cor do tenant */
        [data-sidebar] .bg-emerald-50,
        [data-sidebar] .bg-emerald-100 { background-color: ${corPrimaria}15 !important; }
        
        /* Sidebar menu item hover */
        [data-sidebar] .hover\\:bg-emerald-50:hover { background-color: ${corPrimaria}18 !important; }
        [data-sidebar] .hover\\:bg-emerald-900\\/20:hover { background-color: ${corPrimaria}25 !important; }
      `;
      
      // Atualizar favicon se disponível
      if (tenant.branding.favicon) {
        const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (favicon) {
          favicon.href = tenant.branding.favicon;
        }
      }
      
      // Atualizar título da página
      document.title = tenant.branding.nomeExibicao;
    }
  }, [tenant]);

  const hasFeature = (feature: keyof TenantConfig['features']): boolean => {
    if (!tenant) return false;
    return tenant.features[feature] ?? false;
  };

  const shouldShowAds = (): boolean => {
    if (!tenant) return false;
    // Mostrar anúncios se: está habilitado E (é plano free OU está no projeto orbita-free)
    return tenant.ads.exibirAnuncios || isFreePlan;
  };

  const getPrimaryColor = (): string => {
    return tenant?.branding.corPrimaria ?? '#10b981';
  };

  const getSecondaryColor = (): string => {
    return tenant?.branding.corSecundaria ?? '#14b8a6';
  };

  const value: TenantContextType = {
    tenant,
    isLoading,
    error,
    firebaseProject: currentProject,
    isFreePlan,
    isWhiteLabel,
    hasFeature,
    shouldShowAds,
    getPrimaryColor,
    getSecondaryColor,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Hook para verificar se uma feature está disponível
export function useFeature(feature: keyof TenantConfig['features']): boolean {
  const { hasFeature } = useTenant();
  return hasFeature(feature);
}

// Hook para verificar se deve mostrar anúncios
export function useAds(): { shouldShow: boolean; clientId?: string; slots?: TenantConfig['ads']['slots'] } {
  const { tenant, shouldShowAds } = useTenant();
  return {
    shouldShow: shouldShowAds(),
    clientId: tenant?.ads.googleAdsClientId,
    slots: tenant?.ads.slots,
  };
}
