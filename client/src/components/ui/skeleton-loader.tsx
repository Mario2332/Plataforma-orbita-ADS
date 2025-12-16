import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Componente base de skeleton para loading
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

/**
 * Skeleton para cards de estatísticas
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

/**
 * Skeleton para lista de itens
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

/**
 * Skeleton para tabela de cronograma
 */
export function CronogramaSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header da tabela */}
        <div className="grid grid-cols-8 gap-1 bg-muted p-2">
          <Skeleton className="h-6 w-16" />
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        
        {/* Linhas da tabela */}
        {[...Array(12)].map((_, row) => (
          <div key={row} className="grid grid-cols-8 gap-1 p-1 border-t">
            <Skeleton className="h-8 w-16" />
            {[...Array(7)].map((_, col) => (
              <Skeleton key={col} className="h-8 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para cards do dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Gráfico */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      
      {/* Lista */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-32" />
        </div>
        {[...Array(5)].map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para página de estudos
 */
export function EstudosSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Filtros */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      
      {/* Lista de estudos */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para página de simulados
 */
export function SimuladosSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      {/* Cards de simulados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton genérico para páginas
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
