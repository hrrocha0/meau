import "react-native-gesture-handler";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const GUEST_ALLOWED_ROUTES = new Set(["login", "signup", "error"]);
const UNAUTH_ONLY_ROUTES = new Set(["login", "signup"]);

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
        const isGuestAllowedRoute = firstSegment
            ? GUEST_ALLOWED_ROUTES.has(firstSegment)
            : false;
        const isUnauthOnlyRoute = firstSegment
            ? UNAUTH_ONLY_ROUTES.has(firstSegment)
            : false;
        const isHomeRoute = firstSegment === "(drawer)" && segments.length === 1;
        const isAnimalRegisterRoute =
            (firstSegment === "(drawer)" && secondSegment === "register-animal") ||
            (firstSegment === "pets" && secondSegment === "register");
        const isProtectedRoute =
            !isGuestAllowedRoute && !isHomeRoute && !isAnimalRegisterRoute;

        if (!user && isProtectedRoute) {
            router.replace("/(drawer)");
            return;
        }

        if (user && isUnauthOnlyRoute) {
            router.replace("/(drawer)");
        }
    }, [isAuthResolved, router, segments, user]);

    if (!isAuthResolved) {
        return null;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
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
