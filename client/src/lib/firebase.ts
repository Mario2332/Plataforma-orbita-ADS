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

// Configuração do Firebase - Órbita Free (Gratuito com anúncios)
const firebaseConfig = {
  apiKey: "AIzaSyCFbjDY4Qxm4Doh21skK14McK6ICejIITA",
  authDomain: "orbita-free.firebaseapp.com",
  projectId: "orbita-free",
  storageBucket: "orbita-free.firebasestorage.app",
  messagingSenderId: "912900770930",
  appId: "1:912900770930:web:0e722969c008b38fe1c6eb"
};

// Exportar informações do projeto atual
export const currentProject = firebaseConfig.projectId;
export const isFreePlan = true;
export const isWhiteLabel = false;

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
