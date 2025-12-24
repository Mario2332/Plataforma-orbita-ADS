import { useEffect, useRef } from 'react';
import { useAds } from '@/contexts/TenantContext';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export type AdSize = 
  | 'banner'           // 728x90 - Leaderboard
  | 'rectangle'        // 300x250 - Medium Rectangle
  | 'large-rectangle'  // 336x280 - Large Rectangle
  | 'sidebar'          // 300x600 - Half Page
  | 'mobile-banner'    // 320x50 - Mobile Banner
  | 'responsive';      // Auto-size

interface AdBannerProps {
  size?: AdSize;
  slot?: string;
  className?: string;
  testMode?: boolean;
}

const AD_SIZES: Record<AdSize, { width: number; height: number }> = {
  'banner': { width: 728, height: 90 },
  'rectangle': { width: 300, height: 250 },
  'large-rectangle': { width: 336, height: 280 },
  'sidebar': { width: 300, height: 600 },
  'mobile-banner': { width: 320, height: 50 },
  'responsive': { width: 0, height: 0 },
};

/**
 * Componente de banner de anúncio do Google AdSense
 * Só renderiza se o tenant tiver anúncios habilitados
 */
export function AdBanner({ 
  size = 'rectangle', 
  slot,
  className = '',
  testMode = false 
}: AdBannerProps) {
  const { shouldShow, clientId, slots } = useAds();
  const adRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  // Determinar o slot a usar
  const adSlot = slot || (size === 'banner' ? slots?.header : 
                          size === 'sidebar' ? slots?.sidebar :
                          size === 'rectangle' ? slots?.inContent :
                          slots?.footer);

  useEffect(() => {
    // Não carregar se anúncios não devem ser exibidos
    if (!shouldShow || !clientId) return;
    
    // Não carregar se já foi carregado
    if (isLoaded.current) return;

    // Carregar script do AdSense se ainda não estiver carregado
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Inicializar o anúncio
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isLoaded.current = true;
    } catch (e) {
      console.error('[AdBanner] Erro ao carregar anúncio:', e);
    }
  }, [shouldShow, clientId]);

  // Não renderizar nada se anúncios não devem ser exibidos
  if (!shouldShow) {
    return null;
  }

  const { width, height } = AD_SIZES[size];
  const isResponsive = size === 'responsive';

  // Modo de teste - mostra placeholder visual
  if (testMode || !clientId) {
    return (
      <div 
        className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden ${className}`}
        style={isResponsive ? { minHeight: 90, width: '100%' } : { width, height }}
      >
        <div className="text-center text-gray-400 dark:text-gray-500 p-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">Publicidade</span>
          </div>
          <p className="text-[10px] opacity-60">{isResponsive ? 'Anúncio Responsivo' : `${width}×${height}`}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={adRef} className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={isResponsive 
          ? { display: 'block' }
          : { display: 'inline-block', width, height }
        }
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={isResponsive ? 'auto' : undefined}
        data-full-width-responsive={isResponsive ? 'true' : undefined}
      />
    </div>
  );
}

/**
 * Banner de anúncio para o header (728x90)
 */
export function HeaderAd({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:flex justify-center py-2 ${className}`}>
      <AdBanner size="banner" />
    </div>
  );
}

/**
 * Banner de anúncio para sidebar (300x250 ou 300x600)
 */
export function SidebarAd({ large = false, className = '' }: { large?: boolean; className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <AdBanner size={large ? 'sidebar' : 'rectangle'} />
    </div>
  );
}

/**
 * Banner de anúncio entre conteúdo (336x280)
 */
export function InContentAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center my-6 ${className}`}>
      <AdBanner size="large-rectangle" />
    </div>
  );
}

/**
 * Banner de anúncio para mobile (320x50)
 */
export function MobileAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex md:hidden justify-center py-2 ${className}`}>
      <AdBanner size="mobile-banner" />
    </div>
  );
}

/**
 * Banner responsivo que se adapta ao container
 */
export function ResponsiveAd({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full ${className}`}>
      <AdBanner size="responsive" />
    </div>
  );
}

export default AdBanner;
