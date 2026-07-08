import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants";

type DrawerNavigation = {
  openDrawer: () => void;
};

export default function EmBreveScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={colors.secondaryContainer} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={8}
          onPress={() => (navigation as unknown as DrawerNavigation).openDrawer()}
          style={styles.headerIconButton}
        >
          <MaterialIcons name="menu" size={24} color={colors.onSecondaryContainer} />
        </Pressable>
        <Text style={styles.headerTitle}>Em desenvolvimento</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para home"
          hitSlop={8}
          onPress={() => router.push("/(drawer)")}
          style={styles.headerIconButton}
        >
          <MaterialIcons name="home" size={24} color={colors.onSecondaryContainer} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="construction" size={44} color={colors.onSecondaryContainer} />
        </View>
        <Text style={styles.title}>Página em desenvolvimento</Text>
        <Text style={styles.description}>
          Esta área ainda está sendo criada. Em breve ela estará disponível no Meau.
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(drawer)")} style={styles.button}>
          <Text style={styles.buttonText}>VOLTAR PARA HOME</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.secondaryContainer,
  },
  header: {
    height: 56,
    backgroundColor: colors.secondaryContainer,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(67,67,67,0.18)",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Roboto_500Medium",
    fontSize: 20,
    color: colors.onSecondaryContainer,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Roboto_500Medium",
    fontSize: 22,
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontFamily: "Roboto_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurfaceLowest,
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    minHeight: 48,
    minWidth: 220,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    color: colors.onSecondary,
  },
});
