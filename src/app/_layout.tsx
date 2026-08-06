import "react-native-gesture-handler";
import { Courgette_400Regular } from "@expo-google-fonts/courgette";
import { Roboto_400Regular, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { configureNotificationResponseHandling } from "@/src/services/notifications";

// Registra o handler de notificações imediatamente, antes de qualquer render
const cleanupNotifications = configureNotificationResponseHandling();

const GUEST_ALLOWED_ROUTES = new Set(["login", "error"]);
const UNAUTH_ONLY_ROUTES = new Set(["login"]);

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthResolved, user } = useAuth();

  useEffect(() => {
    if (!isAuthResolved) {
      return;
    }
    const firstSegment = segments[0];
    const secondSegment = segments[1];
    const isGuestAllowedRoute = firstSegment ? GUEST_ALLOWED_ROUTES.has(firstSegment) : false;
    const isUnauthOnlyRoute = firstSegment ? UNAUTH_ONLY_ROUTES.has(firstSegment) : false;
    const isDrawerSignUpRoute = firstSegment === "(drawer)" && secondSegment === "signup";
    const isHomeRoute = segments.length === 0 || (firstSegment === "(drawer)" && segments.length === 1);
    const isAdoptionRoute = firstSegment === "(drawer)" && secondSegment === "adotar";
    const isAnimalDetailsRoute = firstSegment === "animal" && segments.length === 2;
    const isAnimalRegisterRoute =
      (firstSegment === "(drawer)" && secondSegment === "register-animal") ||
      (firstSegment === "pets" && secondSegment === "register");
    const isProtectedRoute =
      !isGuestAllowedRoute &&
      !isDrawerSignUpRoute &&
      !isHomeRoute &&
      !isAdoptionRoute &&
      !isAnimalDetailsRoute &&
      !isAnimalRegisterRoute;

    if (!user && isProtectedRoute) {
      router.replace("/login");
      return;
    }
    if (user && (isUnauthOnlyRoute || isDrawerSignUpRoute)) {
      router.replace("/(drawer)");
    }
  }, [isAuthResolved, router, segments, user]);

  if (!isAuthResolved) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Courgette_400Regular,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  useEffect(() => {
    return cleanupNotifications;
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});