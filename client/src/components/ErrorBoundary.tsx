import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Props {
  children: ReactNode;
  componentName?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    
    // Salvar erro no Firestore para monitoramento
    this.logErrorToFirestore(error, errorInfo);
  }

  async logErrorToFirestore(error: Error, errorInfo: ErrorInfo) {
    try {
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      
      await addDoc(collection(db, 'errorLogs'), {
        componentName: this.props.componentName || 'Unknown',
        errorMessage: error.message,
        errorStack: error.stack || '',
        errorInfo: errorInfo.componentStack || '',
        userId: userId || 'anonymous',
        userEmail: userEmail || 'unknown',
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      console.log('✅ Erro registrado no Firestore para análise');
    } catch (logError) {
      console.error('❌ Erro ao salvar log no Firestore:', logError);
    }
  }

  handleClearCacheAndReload = () => {
    // Limpar localStorage
    localStorage.removeItem('autodiagnostico-cache');
    
    // Limpar cache do service worker
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Recarregar página com force reload
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4 font-semibold">
              {this.props.fallbackMessage || "Ops! Algo deu errado"}
            </h2>

            <p className="text-muted-foreground mb-6 text-center">
              Encontramos um problema ao carregar esta seção. Não se preocupe, seus dados estão seguros.
              Este erro foi registrado automaticamente e será analisado pela equipe técnica.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
                <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                  {this.state.error?.stack}
                </pre>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 rounded-lg flex-1",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleClearCacheAndReload}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 rounded-lg flex-1",
                  "bg-secondary text-secondary-foreground border",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                Limpar Cache e Recarregar
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
