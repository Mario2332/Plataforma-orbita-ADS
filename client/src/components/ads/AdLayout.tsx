import { ReactNode } from 'react';
import { useAds } from '@/contexts/TenantContext';
import { HeaderAd, SidebarAd, MobileAd, ResponsiveAd } from './AdBanner';

interface AdLayoutProps {
  children: ReactNode;
  showHeaderAd?: boolean;
  showSidebarAd?: boolean;
  showMobileAd?: boolean;
  showFooterAd?: boolean;
}

/**
 * Layout wrapper que adiciona espaços de anúncios condicionalmente
 * Só exibe anúncios se o tenant tiver essa configuração habilitada
 */
export function AdLayout({
  children,
  showHeaderAd = true,
  showSidebarAd = false,
  showMobileAd = true,
  showFooterAd = true,
}: AdLayoutProps) {
  const { shouldShow } = useAds();

  // Se não deve mostrar anúncios, renderiza apenas o conteúdo
  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <div className="ad-layout">
      {/* Anúncio no topo - Desktop */}
      {showHeaderAd && (
        <div className="ad-header-container mb-4">
          <HeaderAd />
        </div>
      )}

      {/* Anúncio mobile no topo */}
      {showMobileAd && (
        <div className="ad-mobile-container mb-4">
          <MobileAd />
        </div>
      )}

      {/* Layout principal com sidebar opcional */}
      {showSidebarAd ? (
        <div className="flex gap-6">
          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

          {/* Sidebar com anúncios - Desktop only */}
          <aside className="hidden lg:block w-[300px] shrink-0">
            <div className="sticky top-4 space-y-4">
              <SidebarAd />
              <SidebarAd />
            </div>
          </aside>
        </div>
      ) : (
        children
      )}

      {/* Anúncio no rodapé */}
      {showFooterAd && (
        <div className="ad-footer-container mt-6">
          <ResponsiveAd />
        </div>
      )}
    </div>
  );
}

/**
 * Componente para inserir anúncio entre seções de conteúdo
 */
export function AdBreak() {
  const { shouldShow } = useAds();

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="ad-break my-8 flex justify-center">
      <div className="w-full max-w-[336px]">
        <ResponsiveAd />
      </div>
    </div>
  );
}

/**
 * HOC para adicionar anúncios a uma página
 */
export function withAds<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  adOptions?: Omit<AdLayoutProps, 'children'>
) {
  return function WithAdsComponent(props: P) {
    return (
      <AdLayout {...adOptions}>
        <WrappedComponent {...props} />
      </AdLayout>
    );
  };
}

export default AdLayout;
