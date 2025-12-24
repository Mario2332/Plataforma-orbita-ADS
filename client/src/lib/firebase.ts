import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  CACHE_SIZE_UNLIMITED,
  Firestore
} from "firebase/firestore";
import { getStorage, connectStorageEmulator, FirebaseStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator, Functions } from "firebase/functions";

// Configuração do Firebase - Plataforma Órbita (White-label B2B)
const firebaseConfigOrbita = {
  apiKey: "AIzaSyAQkK8xj-WXb0IVBh3rDJbUrJgb0wC75-U",
  authDomain: "plataforma-orbita.firebaseapp.com",
  projectId: "plataforma-orbita",
  storageBucket: "plataforma-orbita.firebasestorage.app",
  messagingSenderId: "896953885758",
  appId: "1:896953885758:web:06d5dc91e80cfa13bd9d6f",
  measurementId: "G-FQL285W4M6"
};

// Configuração do Firebase - Órbita Free (Gratuito com anúncios)
const firebaseConfigFree = {
  apiKey: "AIzaSyCFbjDY4Qxm4Doh21skK14McK6ICejIITA",
  authDomain: "orbita-free.firebaseapp.com",
  projectId: "orbita-free",
  storageBucket: "orbita-free.firebasestorage.app",
  messagingSenderId: "912900770930",
  appId: "1:912900770930:web:0e722969c008b38fe1c6eb"
};

// Determinar qual projeto usar baseado no domínio ou variável de ambiente
function getFirebaseConfig() {
  // Verificar variável de ambiente primeiro (para builds específicos)
  const envProject = import.meta.env.VITE_FIREBASE_PROJECT;
  
  if (envProject === 'orbita-free') {
    console.log('[Firebase] Usando projeto: orbita-free');
    return firebaseConfigFree;
  }
  
  if (envProject === 'plataforma-orbita') {
    console.log('[Firebase] Usando projeto: plataforma-orbita');
    return firebaseConfigOrbita;
  }
  
  // Se não houver variável de ambiente, determinar pelo domínio
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Domínios do projeto orbita-free
  const freeHostnames = [
    'orbita-free.web.app',
    'orbita-free.firebaseapp.com',
    'orbitafree.com.br',
    'www.orbitafree.com.br',
  ];
  
  if (freeHostnames.includes(hostname)) {
    console.log('[Firebase] Usando projeto: orbita-free (detectado por domínio)');
    return firebaseConfigFree;
  }
  
  // Default: plataforma-orbita (white-label)
  console.log('[Firebase] Usando projeto: plataforma-orbita (default)');
  return firebaseConfigOrbita;
}

// Obter configuração atual
const firebaseConfig = getFirebaseConfig();

// Exportar informações do projeto atual
export const currentProject = firebaseConfig.projectId;
export const isFreePlan = currentProject === 'orbita-free';
export const isWhiteLabel = currentProject === 'plataforma-orbita';

// Inicializar Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Inicializar Auth
export const auth: Auth = getAuth(app);

// Inicializar Firestore com persistência de cache habilitada
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Inicializar Storage
export const storage: FirebaseStorage = getStorage(app);

// Inicializar Functions (região São Paulo)
export const functions: Functions = getFunctions(app, 'southamerica-east1');

// Conectar aos emuladores em desenvolvimento (opcional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

/**
 * Pré-aquecer a conexão do Firestore
 */
export async function warmupFirestoreConnection(): Promise<void> {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
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
