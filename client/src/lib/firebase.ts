import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyChFCUxaTiXIcNh0PCFORe_FTK8NWV0xLA",
  authDomain: "plataforma-mentoria-mario.firebaseapp.com",
  projectId: "plataforma-mentoria-mario",
  storageBucket: "plataforma-mentoria-mario.firebasestorage.app",
  messagingSenderId: "1072418970493",
  appId: "1:1072418970493:web:f5184d12a0e67ba0d70a14"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Inicializar Auth
export const auth = getAuth(app);

// Inicializar Firestore com persistência de cache habilitada
// Isso permite que os dados sejam carregados do cache local instantaneamente
// enquanto busca atualizações do servidor em background
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Inicializar Storage
export const storage = getStorage(app);

// Inicializar Functions (região São Paulo)
export const functions = getFunctions(app, 'southamerica-east1');

// Conectar aos emuladores em desenvolvimento (opcional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

/**
 * Pré-aquecer a conexão do Firestore
 * Chamar esta função logo após o login para iniciar a conexão
 * antes que o usuário navegue para outras páginas
 */
export async function warmupFirestoreConnection(): Promise<void> {
  try {
    // Importar dinamicamente para não bloquear o carregamento inicial
    const { doc, getDoc } = await import("firebase/firestore");
    
    // Fazer uma leitura simples para estabelecer a conexão
    // Usamos o documento do próprio usuário que já será necessário
    const userId = auth.currentUser?.uid;
    if (userId) {
      const userDocRef = doc(db, "users", userId);
      await getDoc(userDocRef);
      console.log('[Firebase] Conexão Firestore pré-aquecida');
    }
  } catch (error) {
    console.warn('[Firebase] Erro ao pré-aquecer conexão:', error);
  }
}
