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
import {
  registerPushTokenForUser,
  unregisterPushTokenForUser,
} from "../services/notifications";

type UserProfilePhoto = {
  base64?: string;
  mimeType?: string;
  width?: number;
  height?: number;
} | null;

type UserProfile = {
  name: string;
  age: number;
  email: string;
  state: string;
  city: string;
  address: string;
  telephone: string;
  username: string;
  profilePhoto?: UserProfilePhoto;
};

type AuthContextValue = {
  isAuthResolved: boolean;
  isProfileLoading: boolean;
  user: User | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [registeredPushToken, setRegisteredPushToken] = useState<string | null>(null);

  async function loadProfile(firebaseUser: User) {
    const profileRef = doc(db, "users", firebaseUser.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (profileSnapshot.exists()) {
      setProfile(profileSnapshot.data() as UserProfile);
    } else {
      setProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setIsProfileLoading(false);
        setIsAuthResolved(true);
        setRegisteredPushToken(null);
        return;
      }

      setIsProfileLoading(true);

      try {
        await loadProfile(firebaseUser);
      } catch (error) {
        console.error("Erro ao carregar perfil do usuário:", error);
        setProfile(null);
      } finally {
        setIsProfileLoading(false);
        setIsAuthResolved(true);
      }

      registerPushTokenForUser(firebaseUser.uid)
        .then(setRegisteredPushToken)
        .catch((error) => {
          console.error("Erro ao registrar token de notificação:", error);
          setRegisteredPushToken(null);
        });
    });

    return unsubscribe;
  }, []);

  async function logout() {
    if (user?.uid) {
      await unregisterPushTokenForUser(user.uid, registeredPushToken).catch((error) => {
        console.error("Erro ao remover token de notificação:", error);
      });
    }

    await signOut(auth);
  }

  async function refreshProfile() {
    if (!user) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);

    try {
      await loadProfile(user);
    } finally {
      setIsProfileLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthResolved,
        isProfileLoading,
        user,
        profile,
        refreshProfile,
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
