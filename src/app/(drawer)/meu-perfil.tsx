import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { doc, updateDoc } from "firebase/firestore";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { InputField } from "@/src/components/inputField";
import { colors } from "@/constants";
import { useAuth } from "@/src/contexts/AuthContext";
import { db } from "@/firebaseConfig";

const ESTADOS_BR = [
  "Acre",
  "Alagoas",
  "Amapá",
  "Amazonas",
  "Bahia",
  "Ceará",
  "Distrito Federal",
  "Espírito Santo",
  "Goiás",
  "Maranhão",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Pará",
  "Paraíba",
  "Paraná",
  "Pernambuco",
  "Piauí",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondônia",
  "Roraima",
  "Santa Catarina",
  "São Paulo",
  "Sergipe",
  "Tocantins",
];

type DrawerNavigation = {
  openDrawer: () => void;
};

function formatTelephone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

export default function MeuPerfilScreen() {
  const navigation = useNavigation();
  const { user, profile, isProfileLoading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [telephone, setTelephone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setUsername(profile?.username ?? "");
    setAge(profile?.age ? String(profile.age) : "");
    setState(profile?.state ?? "");
    setCity(profile?.city ?? "");
    setAddress(profile?.address ?? "");
    setTelephone(profile?.telephone ?? "");
  }, [profile]);

  async function handleSave() {
    if (!user?.uid || isSaving) {
      return;
    }

    if (name.trim().length < 3 || username.trim().length < 3) {
      Alert.alert("Dados incompletos", "Informe nome e nome de usuário com pelo menos 3 caracteres.");
      return;
    }

    if (city.trim().length < 2 || address.trim().length < 5 || !ESTADOS_BR.includes(state)) {
      Alert.alert("Endereço incompleto", "Confira estado, cidade e endereço antes de salvar.");
      return;
    }

    try {
      setIsSaving(true);
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        username: username.trim(),
        age: Number(age) || 0,
        state: state.trim(),
        city: city.trim(),
        address: address.trim(),
        telephone: telephone.trim(),
      });
      await refreshProfile();
      Alert.alert("Perfil atualizado", "Suas informações foram salvas.");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar o perfil agora.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={colors.secondaryContainer} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Entre na sua conta para ver o perfil.</Text>
          <Pressable style={styles.button} onPress={() => router.push("/login")}>
            <Text style={styles.buttonText}>ENTRAR</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Meu perfil</Text>
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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isProfileLoading ? <ActivityIndicator size="small" color={colors.onSurface} /> : null}

        <Text style={styles.sectionTitle}>INFORMAÇÕES PESSOAIS</Text>
        <View style={styles.formGroup}>
          <InputField placeholder="Nome completo" value={name} onChangeText={setName} />
          <InputField placeholder="Nome de usuário" value={username} onChangeText={setUsername} />
          <InputField
            placeholder="Idade"
            inputMode="numeric"
            value={age}
            onChangeText={(value) => setAge(value.replace(/\D/g, "").slice(0, 3))}
          />
          <InputField placeholder="E-mail" value={profile?.email ?? user.email ?? ""} editable={false} />
        </View>

        <Text style={styles.sectionTitle}>ENDEREÇO E CONTATO</Text>
        <View style={styles.formGroup}>
          <InputField
            placeholder="Estado"
            value={state}
            editable={false}
            showDropdownIndicator
            onPress={() => setIsStateModalOpen(true)}
          />
          <InputField placeholder="Cidade" value={city} onChangeText={setCity} />
          <InputField placeholder="Endereço" value={address} onChangeText={setAddress} />
          <InputField
            placeholder="Telefone"
            inputMode="tel"
            value={telephone}
            onChangeText={(value) => setTelephone(formatTelephone(value))}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.button, isSaving ? styles.buttonDisabled : null]}
        >
          <Text style={styles.buttonText}>{isSaving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={isStateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStateModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsStateModalOpen(false)}>
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o estado</Text>
              <Pressable onPress={() => setIsStateModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ESTADOS_BR.map((stateOption) => (
                <Pressable
                  key={stateOption}
                  style={styles.stateOption}
                  onPress={() => {
                    setState(stateOption);
                    setIsStateModalOpen(false);
                  }}
                >
                  <Text style={styles.stateOptionText}>{stateOption}</Text>
                  {state === stateOption ? <Ionicons name="checkmark" size={18} color="#589b9b" /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    flexGrow: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 24,
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: colors.secondary,
  },
  formGroup: {
    gap: 28,
    marginBottom: 12,
  },
  button: {
    alignSelf: "center",
    minWidth: 220,
    minHeight: 48,
    marginTop: 28,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    color: colors.onSecondary,
  },
  emptyState: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 16,
    color: colors.onSurface,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    maxHeight: "70%",
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingVertical: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
  },
  modalTitle: {
    fontFamily: "Roboto_500Medium",
    fontSize: 16,
    color: colors.onSurface,
  },
  stateOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
  },
  stateOptionText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: colors.onSurfaceLowest,
  },
});
