import { useTenant } from '@/contexts/TenantContext';
import { APP_TITLE, APP_LOGO } from '@/const';

/**
 * Hook para obter configurações de branding do tenant atual
 * Fallback para constantes padrão se tenant não estiver carregado
 */
export function useBranding() {
  const { tenant, isLoading } = useTenant();

  return {
    // Nome da plataforma
    appTitle: tenant?.branding.nomeExibicao ?? APP_TITLE,
    
    // Logo
    appLogo: tenant?.branding.logo ?? APP_LOGO,
    appLogoSmall: tenant?.branding.logoSmall ?? tenant?.branding.logo ?? APP_LOGO,
    
    // Cores
    primaryColor: tenant?.branding.corPrimaria ?? '#10b981',
    primaryColorHover: tenant?.branding.corPrimariaHover ?? '#059669',
    secondaryColor: tenant?.branding.corSecundaria ?? '#14b8a6',
    
    // Suporte
    supportUrl: tenant?.branding.urlSuporte,
    supportEmail: tenant?.branding.emailSuporte,
    
    // Estado
    isLoading,
    
    // Plano
    plan: tenant?.plano ?? 'free',
    isWhiteLabel: tenant?.plano === 'white-label',
    isPremium: tenant?.plano === 'premium' || tenant?.plano === 'white-label',
    isFree: tenant?.plano === 'free',
  };
}

/**
 * Hook para aplicar cores CSS customizadas do tenant
 */
export function useTenantColors() {
  const { tenant } = useTenant();
  
  // Retorna classes CSS ou estilos inline baseados nas cores do tenant
  return {
    primaryBg: tenant?.branding.corPrimaria 
      ? { backgroundColor: tenant.branding.corPrimaria }
      : {},
    primaryText: tenant?.branding.corPrimaria
      ? { color: tenant.branding.corPrimaria }
      : {},
    primaryBorder: tenant?.branding.corPrimaria
      ? { borderColor: tenant.branding.corPrimaria }
      : {},
  };
}
