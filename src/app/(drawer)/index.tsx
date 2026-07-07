import { colors } from "@/constants";
import { AppButton } from "@/src/components/appButton";
import { Brand } from "@/src/components/brand";
import { DrawerButton } from "@/src/components/drawerButton";
import { useAuth } from "@/src/contexts/AuthContext";
import { useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DrawerNavigation = {
  openDrawer: () => void;
};

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const { profile, user } = useAuth();
  const displayName =
    profile?.username?.trim() ||
    profile?.name?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "usuário";

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ margin: 12 }}>
              <DrawerButton
                color={colors.secondary}
                onPress={() => (navigation as unknown as DrawerNavigation).openDrawer()}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
      <View style={styles.body}>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <ScrollView contentContainerStyle={{ alignItems: "center" }}>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.text0}>Olá, {displayName}!</Text>
            </View>
            <View style={{ marginTop: 52 }}>
              <Text style={styles.text1}>
                Bem vindo ao Meau!{`\n`}
                Aqui você pode adotar, doar e ajudar{`\n`}
                cães e gatos com facilidade.{`\n`}
                Qual o seu interesse?
              </Text>
            </View>
            <View style={{ marginTop: 48, gap: 12 }}>
              <AppButton
                text="ADOTAR"
                backgroundColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => {
                  router.push("/(drawer)/adotar");
                }}
              />
              <AppButton
                text="CADASTRAR ANIMAL"
                backgroundColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => {
                  router.push("/register-animal");
                }}
              />
            </View>
            <View style={{ marginTop: 68, marginBottom: 32 }}>
              <Brand />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {},
  body: {
    flex: 1,
  },
  text0: {
    textAlign: "center",
    fontFamily: "Courgette_400Regular",
    fontSize: 44,
    color: colors.primary,
    paddingHorizontal: 20,
  },
  text1: {
    textAlign: "center",
    fontFamily: "Roboto_400Regular",
    fontSize: 16,
    color: colors.onSurface,
  },
});
