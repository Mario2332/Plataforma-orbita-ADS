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

  // Modo de teste - mostra placeholder
  if (testMode || !clientId) {
    return (
      <div 
        className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center ${className}`}
        style={isResponsive ? { minHeight: 90 } : { width, height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400 p-4">
          <p className="text-sm font-medium">Espaço para Anúncio</p>
          <p className="text-xs">{isResponsive ? 'Responsivo' : `${width}x${height}`}</p>
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
