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
        /* Botões e elementos com bg-emerald */
        .bg-emerald-500, .bg-emerald-600 { background-color: ${corPrimaria} !important; }
        .bg-emerald-50, .bg-emerald-100 { background-color: ${corPrimaria}15 !important; }
        .hover\\:bg-emerald-600:hover, .hover\\:bg-emerald-700:hover { background-color: ${corPrimariaHover} !important; }
        .hover\\:bg-emerald-50:hover, .hover\\:bg-emerald-100:hover { background-color: ${corPrimaria}20 !important; }
        
        /* Texto com text-emerald */
        .text-emerald-500, .text-emerald-600, .text-emerald-700 { color: ${corPrimaria} !important; }
        .text-emerald-400 { color: ${corSecundaria} !important; }
        
        /* Bordas com border-emerald */
        .border-emerald-200, .border-emerald-300 { border-color: ${corPrimaria}40 !important; }
        .border-emerald-500, .border-emerald-600 { border-color: ${corPrimaria} !important; }
        
        /* Ring com ring-emerald */
        .ring-emerald-200, .ring-emerald-300 { --tw-ring-color: ${corPrimaria}40 !important; }
        .ring-emerald-500, .ring-emerald-600 { --tw-ring-color: ${corPrimaria} !important; }
        
        /* Gradientes de/para emerald */
        .from-emerald-500, .from-emerald-600 { --tw-gradient-from: ${corPrimaria} !important; }
        .to-emerald-500, .to-emerald-600 { --tw-gradient-to: ${corPrimaria} !important; }
        .via-emerald-500, .via-emerald-600 { --tw-gradient-via: ${corPrimaria} !important; }
        
        /* Teal como secundário */
        .bg-teal-500, .bg-teal-600 { background-color: ${corSecundaria} !important; }
        .text-teal-500, .text-teal-600 { color: ${corSecundaria} !important; }
        .from-teal-500, .from-teal-600 { --tw-gradient-from: ${corSecundaria} !important; }
        .to-teal-500, .to-teal-600 { --tw-gradient-to: ${corSecundaria} !important; }
        
        /* Dark mode adjustments */
        .dark .bg-emerald-900\\/30, .dark .bg-emerald-900\\/20 { background-color: ${corPrimaria}20 !important; }
        .dark .text-emerald-400 { color: ${corSecundaria} !important; }
        .dark .border-emerald-900\\/30 { border-color: ${corPrimaria}30 !important; }
        .dark .ring-emerald-800 { --tw-ring-color: ${corPrimaria}60 !important; }
        .dark .hover\\:bg-emerald-900\\/30:hover { background-color: ${corPrimaria}30 !important; }
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
