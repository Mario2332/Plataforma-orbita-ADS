import { createContext, useContext, ReactNode } from "react";
import { useAuth, UserData, UserRole } from "../hooks/useAuth";
import { User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<FirebaseUser>;
  signUp: (email: string, password: string, name: string, mentorId: string | null) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { name?: string; email?: string }) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

// Hook auxiliar para verificar role
export function useRequireRole(requiredRole: UserRole) {
  const { userData, loading } = useAuthContext();

  if (loading) return { hasAccess: false, loading: true };
  if (!userData) return { hasAccess: false, loading: false };

  return {
    hasAccess: userData.role === requiredRole,
    loading: false,
  };
}
