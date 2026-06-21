import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { auth, db } from "../firebaseConfig";
import Constants from "expo-constants";

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
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function salvarTokenNotificacao(uid: string) {
  if (Platform.OS === "web") return;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { expoPushToken: tokenData.data });
  } catch (error) {
    console.error("Erro ao salvar token de notificação:", error);
  }
}

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

        // Salva o token de notificação sempre que o usuário logar
        await salvarTokenNotificacao(firebaseUser.uid);
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