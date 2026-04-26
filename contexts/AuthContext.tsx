import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

type UserProfile = {
  name: string;
  age: number;
  email: string;
  state: string;
  city: string;
  address: string;
  telephone: string;
  username: string;
};

type AuthContextValue = {
  isAuthResolved: boolean;
  isProfileLoading: boolean;
  user: User | null;
  profile: UserProfile | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setIsProfileLoading(false);
        setIsAuthResolved(true);
        return;
      }

      setIsProfileLoading(true);

      try {
        const profileRef = doc(db, "users", firebaseUser.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (profileSnapshot.exists()) {
          setProfile(profileSnapshot.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil do usuário:", error);
        setProfile(null);
      } finally {
        setIsProfileLoading(false);
        setIsAuthResolved(true);
      }
    });

    return unsubscribe;
  }, []);

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthResolved,
        isProfileLoading,
        user,
        profile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}
