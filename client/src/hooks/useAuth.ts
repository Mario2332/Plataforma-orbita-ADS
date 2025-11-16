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
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export type UserRole = "gestor" | "mentor" | "aluno";

export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
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
          // Buscar dados do usuário no Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            
            // Garantir que o role existe antes de considerar o carregamento completo
            if (!data.role) {
              console.warn('User data loaded but role is missing, keeping loading state');
              // Manter loading true e tentar novamente após um delay
              setTimeout(() => {
                // Forçar uma nova verificação
                getDoc(userDocRef).then(retrySnap => {
                  if (retrySnap.exists() && retrySnap.data().role) {
                    const retryData = retrySnap.data();
                    const userData: UserData = {
                      uid: firebaseUser.uid,
                      email: retryData.email,
                      name: retryData.name,
                      role: retryData.role as UserRole,
                      createdAt: retryData.createdAt?.toDate() || new Date(),
                      updatedAt: retryData.updatedAt?.toDate() || new Date(),
                      lastSignedIn: retryData.lastSignedIn?.toDate() || new Date(),
                    };
                    setAuthState({
                      user: firebaseUser,
                      userData,
                      loading: false,
                      error: null,
                    });
                  }
                });
              }, 500);
              return;
            }
            
            const userData: UserData = {
              uid: firebaseUser.uid,
              email: data.email,
              name: data.name,
              role: data.role as UserRole,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              lastSignedIn: data.lastSignedIn?.toDate() || new Date(),
            };

            setAuthState({
              user: firebaseUser,
              userData,
              loading: false,
              error: null,
            });
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
      
      // Atualizar lastSignedIn
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, { lastSignedIn: serverTimestamp() }, { merge: true });
      
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

      // Atualizar perfil com nome (antes do trigger disparar)
      await updateProfile(user, { displayName: name });

      // Aguardar um momento para o trigger onUserCreated criar o documento users
      await new Promise(resolve => setTimeout(resolve, 1500));

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

      // Buscar userData recém-criado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userDocRef = doc(db, "users", user.uid);
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
  };
}
