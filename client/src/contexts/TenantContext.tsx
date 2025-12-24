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
      
      // Aplicar como variáveis CSS customizadas
      root.style.setProperty('--tenant-primary', corPrimaria);
      root.style.setProperty('--tenant-primary-hover', corPrimariaHover);
      root.style.setProperty('--tenant-secondary', corSecundaria);
      
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
