import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { clearOldCacheIfNeeded } from "./clearOldCache";
import { registerServiceWorker } from "./registerSW";

// Limpar cache antigo se necessário (executa apenas uma vez)
clearOldCacheIfNeeded();

// Registrar service worker para cache busting automático
registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
