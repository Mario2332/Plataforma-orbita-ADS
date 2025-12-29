import { useEffect, useState } from "react";
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
} from "firebase/auth";
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, warmupFirestoreConnection } from "../lib/firebase";

export type UserRole = "gestor" | "mentor" | "aluno";

export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
  photoURL?: string;
  curso?: string;
  faculdade?: string;
}

export interface AuthState {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Buscar dados do usuário no Firestore (forçando leitura do servidor para evitar cache vazio após logout)
          const userDocRef = doc(db, "users", firebaseUser.uid);
          console.log('[useAuth] onAuthStateChanged: buscando dados do servidor (ignorando cache)');
          const userDocSnap = await getDocFromServer(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log('[useAuth] userData carregado do Firestore:', {
              uid: firebaseUser.uid,
              email: data.email,
              name: data.name,
              nome: data.nome,
              role: data.role,
              hasRole: !!data.role,
              photoURL: data.photoURL,
              hasPhotoURL: !!data.photoURL
            });
            
            // Se dados estiverem faltando, buscar de outras fontes e corrigir
            // Suportar tanto 'nome' (português) quanto 'name' (inglês)
            let email = data.email || firebaseUser.email || "";
            let name = data.name || data.nome || firebaseUser.displayName || "Usuário";
            let role = data.role as UserRole;
            
            // Se role estiver faltando, tentar descobrir
            if (!role) {
              console.warn('[useAuth] Role não encontrado, tentando descobrir...');
              
              // Verificar se é aluno
              const alunoDocRef = doc(db, "alunos", firebaseUser.uid);
              const alunoDoc = await getDoc(alunoDocRef);
              if (alunoDoc.exists()) {
                role = "aluno";
                console.log('[useAuth] Usuário identificado como aluno');
              } else {
                // Verificar se é mentor
                const mentorDocRef = doc(db, "mentores", firebaseUser.uid);
                const mentorDoc = await getDoc(mentorDocRef);
                if (mentorDoc.exists()) {
                  role = "mentor";
                  console.log('[useAuth] Usuário identificado como mentor');
                } else {
                  // Verificar se é gestor
                  const gestorDocRef = doc(db, "gestores", firebaseUser.uid);
                  const gestorDoc = await getDoc(gestorDocRef);
                  if (gestorDoc.exists()) {
                    role = "gestor";
                    console.log('[useAuth] Usuário identificado como gestor');
                  } else {
                    // Padrão: aluno
                    role = "aluno";
                    console.warn('[useAuth] Role não encontrado em nenhuma coleção, usando padrão: aluno');
                  }
                }
              }
              
              // Atualizar documento users com dados corretos (preservando photoURL)
              console.log('[useAuth] Atualizando documento users com dados corrigidos');
              
              // SOLUÇÃO ROBUSTA: Buscar photoURL atual do servidor antes de atualizar
              const currentDocSnap = await getDocFromServer(userDocRef);
              const currentPhotoURL = currentDocSnap.exists() ? currentDocSnap.data()?.photoURL : null;
              console.log('[useAuth] photoURL atual no servidor:', currentPhotoURL);
              
              const updateData: any = {
                email,
                name,  // Padronizar para 'name' em inglês
                nome: name,  // Manter 'nome' para compatibilidade
                role,
                updatedAt: serverTimestamp()
              };
              
              // Preservar photoURL se existir no servidor (ignora cache)
              if (currentPhotoURL) {
                updateData.photoURL = currentPhotoURL;
                console.log('[useAuth] Preservando photoURL do servidor:', currentPhotoURL);
              } else {
                console.log('[useAuth] Nenhum photoURL encontrado no servidor');
              }
              
              await setDoc(userDocRef, updateData, { merge: true });
            }
            
            const userData: UserData = {
              uid: firebaseUser.uid,
              email,
              name,
              role,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              lastSignedIn: data.lastSignedIn?.toDate() || new Date(),
              photoURL: data.photoURL,
              curso: data.curso,
              faculdade: data.faculdade,
            };

            console.log('[useAuth] Definindo authState com userData completo:', {
              loading: false,
              hasPhotoURL: !!userData.photoURL,
              photoURL: userData.photoURL
            });
            setAuthState({
              user: firebaseUser,
              userData,
              loading: false,
              error: null,
            });
            
            // Pré-aquecer conexão do Firestore em background
            // Isso reduz o tempo de carregamento das próximas páginas
            warmupFirestoreConnection();
          } else {
            // Documento do usuário não existe (erro de configuração)
            setAuthState({
              user: null,
              userData: null,
              loading: false,
              error: "Dados do usuário não encontrados",
            });
          }
        } catch (error: any) {
          setAuthState({
            user: null,
            userData: null,
            loading: false,
            error: error.message,
          });
        }
      } else {
        setAuthState({
          user: null,
          userData: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Atualizar lastSignedIn (preservando outros campos com merge: true)
      const userDocRef = doc(db, "users", userCredential.user.uid);
      console.log('[useAuth] signIn: atualizando lastSignedIn com merge: true');
      await setDoc(userDocRef, { lastSignedIn: serverTimestamp() }, { merge: true });
      console.log('[useAuth] signIn: lastSignedIn atualizado');
      
      return userCredential.user;
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Função de cadastro (apenas para alunos)
  const signUp = async (email: string, password: string, name: string, mentorId: string | null) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Atualizar perfil com nome
      await updateProfile(user, { displayName: name });

      // Criar documento users (não depender de Cloud Functions)
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: email,
        name: name,
        nome: name,  // Manter compatibilidade
        role: "aluno",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSignedIn: serverTimestamp(),
      });

      // Criar documento do aluno
      const alunoDocRef = doc(db, "alunos", user.uid);
      await setDoc(alunoDocRef, {
        userId: user.uid,
        mentorId: mentorId,
        nome: name,
        email: email,
        celular: null,
        plano: null,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Aguardar um momento para garantir que os documentos foram criados
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Buscar userData recém-criado
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const userData: UserData = {
          uid: user.uid,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastSignedIn: data.lastSignedIn?.toDate() || new Date(),
          photoURL: data.photoURL,
          curso: data.curso,
          faculdade: data.faculdade,
        };

        // Atualizar estado com userData
        setAuthState({
          user: user,
          userData,
          loading: false,
          error: null,
        });
      }

      return user;
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      // Salvar o role atual antes de fazer logout
      const currentRole = authState.userData?.role;
      
      await firebaseSignOut(auth);
      
      // Redirecionar para a página de login correta baseada no role
      if (currentRole === 'aluno') {
        window.location.href = '/login/aluno';
      } else if (currentRole === 'mentor') {
        window.location.href = '/login/mentor';
      } else if (currentRole === 'gestor') {
        window.location.href = '/login/gestor';
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  // Função de reset de senha
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw error;
    }
  };

  // Função de atualização de perfil
  const updateUserProfile = async (updates: { name?: string; email?: string }) => {
    if (!authState.user) throw new Error("Usuário não autenticado");

    try {
      // Atualizar no Firebase Auth
      if (updates.name) {
        await updateProfile(authState.user, { displayName: updates.name });
      }
      if (updates.email) {
        await updateEmail(authState.user, updates.email);
      }

      // Atualizar no Firestore
      const userDocRef = doc(db, "users", authState.user.uid);
      await setDoc(
        userDocRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      throw error;
    }
  };

  // Função para atualizar userData do Firestore
  const refreshUserData = async () => {
    if (!authState.user) return;

    try {
      console.log('[useAuth] refreshUserData: buscando dados do servidor (ignorando cache)');
      const userDocRef = doc(db, "users", authState.user.uid);
      const userDocSnap = await getDocFromServer(userDocRef);  // Força leitura do servidor

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const userData: UserData = {
          uid: authState.user.uid,
          email: data.email || authState.user.email || "",
          name: data.name || data.nome || authState.user.displayName || "Usuário",
          role: data.role as UserRole,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastSignedIn: data.lastSignedIn?.toDate() || new Date(),
          photoURL: data.photoURL,
          curso: data.curso,
          faculdade: data.faculdade,
        };

        console.log('[useAuth] refreshUserData: dados atualizados:', {
          hasPhotoURL: !!userData.photoURL,
          photoURL: userData.photoURL
        });

        setAuthState((prev) => ({
          ...prev,
          userData,
        }));
      }
    } catch (error) {
      console.error('[useAuth] Erro ao atualizar userData:', error);
    }
  };

  // Função de atualização de senha
  const changePassword = async (newPassword: string) => {
    if (!authState.user) throw new Error("Usuário não autenticado");

    try {
      await updatePassword(authState.user, newPassword);
    } catch (error: any) {
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    changePassword,
    refreshUserData,
  };
}
