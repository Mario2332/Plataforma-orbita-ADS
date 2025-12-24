import { ReactNode } from 'react';
import { useFeature } from '@/contexts/TenantContext';
import { TenantConfig } from '@/types/tenant';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type FeatureName = keyof TenantConfig['features'];

interface FeatureGateProps {
  feature: FeatureName;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * Componente que controla acesso a funcionalidades baseado no plano do tenant
 * Se a feature não estiver disponível, mostra fallback ou prompt de upgrade
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const hasAccess = useFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Se tiver fallback customizado, usar ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Se não deve mostrar prompt de upgrade, não renderizar nada
  if (!showUpgradePrompt) {
    return null;
  }

  // Mostrar prompt de upgrade padrão
  return <UpgradePrompt feature={feature} />;
}

interface UpgradePromptProps {
  feature: FeatureName;
  title?: string;
  description?: string;
}

const FEATURE_NAMES: Record<FeatureName, { name: string; description: string }> = {
  estudos: { name: 'Controle de Estudos', description: 'Acompanhe seu tempo de estudo' },
  cronograma: { name: 'Cronograma', description: 'Organize sua rotina de estudos' },
  cronogramaDinamico: { name: 'Cronograma Dinâmico', description: 'Cronograma inteligente que se adapta ao seu ritmo' },
  metricas: { name: 'Métricas', description: 'Visualize seu progresso detalhado' },
  metas: { name: 'Metas', description: 'Defina e acompanhe seus objetivos' },
  simulados: { name: 'Simulados', description: 'Registre e analise seus simulados' },
  redacoes: { name: 'Redações', description: 'Acompanhe suas notas de redação' },
  diarioBordo: { name: 'Diário de Bordo', description: 'Registre sua jornada de estudos' },
  planoAcao: { name: 'Plano de Ação', description: 'Crie planos estratégicos de estudo' },
  autodiagnostico: { name: 'Autodiagnóstico', description: 'Avalie seu nível em cada matéria' },
  mentoria: { name: 'Mentoria', description: 'Tenha acompanhamento de um mentor' },
  relatoriosAvancados: { name: 'Relatórios Avançados', description: 'Análises detalhadas do seu desempenho' },
  exportacaoPDF: { name: 'Exportação PDF', description: 'Exporte seus dados em PDF' },
  integracaoCalendario: { name: 'Integração com Calendário', description: 'Sincronize com Google Calendar' },
};

/**
 * Prompt de upgrade para funcionalidades premium
 */
export function UpgradePrompt({ feature, title, description }: UpgradePromptProps) {
  const featureInfo = FEATURE_NAMES[feature];

  return (
    <Card className="border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
          <Lock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <CardTitle className="text-lg">
          {title || `${featureInfo.name} - Recurso Premium`}
        </CardTitle>
        <CardDescription>
          {description || featureInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Esta funcionalidade está disponível apenas para assinantes Premium.
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Sparkles className="h-4 w-4 mr-2" />
          Fazer Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Hook para verificar múltiplas features de uma vez
 */
export function useFeatures(features: FeatureName[]): Record<FeatureName, boolean> {
  const results: Partial<Record<FeatureName, boolean>> = {};
  
  for (const feature of features) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[feature] = useFeature(feature);
  }
  
  return results as Record<FeatureName, boolean>;
}

/**
 * Componente para mostrar badge de "Premium" em itens do menu
 */
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ${className}`}>
      PRO
    </span>
  );
}

export default FeatureGate;
