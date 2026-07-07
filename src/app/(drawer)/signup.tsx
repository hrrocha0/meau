import Ionicons from "@expo/vector-icons/Ionicons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/src/components/appButton";
import { Card } from "@/src/components/card";
import { DrawerButton } from "@/src/components/drawerButton";
import { ImageButton } from "@/src/components/imageButton";
import { InputField } from "@/src/components/inputField";
import { colors } from "@/constants";
import { auth, db } from "@/firebaseConfig";
import { chooseProfilePhoto, type ProfilePhoto } from "@/src/utils/profileImage";
import * as Notifications from "expo-notifications";

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

type FieldStatus = "default" | "invalid" | "valid";
type FieldName =
  | "name"
  | "age"
  | "email"
  | "state"
  | "city"
  | "address"
  | "telephone"
  | "username"
  | "password"
  | "passwordConfirm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DrawerNavigation = {
  openDrawer: () => void;
};

function formatAge(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
}

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function SignUpScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [telephone, setTelephone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    age: false,
    email: false,
    state: false,
    city: false,
    address: false,
    telephone: false,
    username: false,
    password: false,
    passwordConfirm: false,
  });

  const validations = {
    name: name.trim().length >= 3,
    age: (() => {
      const ageNumber = Number(age);
      return age.length > 0 && Number.isInteger(ageNumber) && ageNumber >= 18 && ageNumber <= 120;
    })(),
    email: EMAIL_REGEX.test(email.trim().toLowerCase()),
    state: ESTADOS_BR.includes(state),
    city: city.trim().length >= 2,
    address: address.trim().length >= 5,
    telephone: telephone.replace(/\D/g, "").length === 10,
    username: username.trim().length >= 3,
    password: password.length >= 6,
    passwordConfirm: passwordConfirm.length > 0 && password === passwordConfirm,
  };

  function touchField(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function touchAllFields() {
    setTouched({
      name: true,
      age: true,
      email: true,
      state: true,
      city: true,
      address: true,
      telephone: true,
      username: true,
      password: true,
      passwordConfirm: true,
    });
  }

  function getFieldStatus(field: FieldName): FieldStatus {
    if (!touched[field]) {
      return "default";
    }

    return validations[field] ? "valid" : "invalid";
  }

  function getFieldHelperText(field: FieldName) {
    if (!touched[field]) {
      return undefined;
    }

    const messages: Record<FieldName, string> = {
      name: validations.name ? "Nome válido." : "Informe o nome completo com pelo menos 3 caracteres.",
      age: validations.age ? "Idade válida." : "Use apenas números entre 18 e 120.",
      email: validations.email ? "E-mail válido." : "Informe um e-mail válido.",
      state: validations.state ? "Estado válido." : "Selecione um estado do Brasil.",
      city: validations.city ? "Cidade válida." : "Informe a cidade com pelo menos 2 caracteres.",
      address: validations.address ? "Endereço válido." : "Informe um endereço mais completo.",
      telephone: validations.telephone ? "Telefone válido." : "Use o formato (DDD) 5555-6666.",
      username: validations.username ? "Nome de usuário válido." : "Use pelo menos 3 caracteres.",
      password: validations.password ? "Senha válida." : "A senha deve ter pelo menos 6 caracteres.",
      passwordConfirm: validations.passwordConfirm ? "As senhas conferem." : "A confirmação deve ser igual à senha.",
    };

    return messages[field];
  }

  async function handleChooseProfileImage() {
    const nextPhoto = await chooseProfilePhoto();

    if (nextPhoto) {
      setProfilePhoto(nextPhoto);
    }
  }

  async function registerUser() {
    if (isSubmitting) {
      return;
    }

    touchAllFields();

    const isFormValid = Object.values(validations).every(Boolean);
    if (!isFormValid) {
      alert("Corrija os campos inválidos antes de continuar.");
      return null;
    }

    try {
      setIsSubmitting(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name.trim(),
        age: Number(age),
        email: email.trim().toLowerCase(),
        state: state.trim(),
        city: city.trim(),
        address: address.trim(),
        telephone: telephone.trim(),
        username: username.trim(),
        profilePhoto: profilePhoto
          ? {
              base64: profilePhoto.base64,
              mimeType: profilePhoto.mimeType,
              width: profilePhoto.width,
              height: profilePhoto.height,
            }
          : null,
        createdAt: serverTimestamp(),
      });

      if (Platform.OS !== "web") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Sucesso!",
            body: `Seja bem-vindo(a) ao Meau, ${username}!`,
          },
          trigger: null,
        });
      }
      router.replace("/(drawer)");
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      alert(`Erro ao criar usuário: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.headerMenuButton}>
              <DrawerButton
                color={colors.onSecondaryContainer}
                onPress={() => (navigation as unknown as DrawerNavigation).openDrawer()}
              />
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.text0}>Cadastro Pessoal</Text>
            </View>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => router.push("/(drawer)")}
              accessibilityLabel="Voltar para home"
            >
              <Ionicons name="arrow-back" size={24} color={colors.onSecondaryContainer} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
      <View style={styles.body}>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <ScrollView contentContainerStyle={{ alignItems: "center" }}>
            <View style={{ marginTop: 16 }}>
              <Card width={328} height={80} backgroundColor={colors.secondaryContainer}>
                <Text style={styles.text1}>
                  As informações preenchidas serão divulgadas{`\n`}
                  apenas para a pessoa com a qual você realizar{`\n`}o processo de adoção e/ou apadrinhamento,{`\n`}
                  após a formalização do processo.
                </Text>
              </Card>
            </View>
            <View style={{ marginHorizontal: 16 }}>
              <View style={{ marginHorizontal: 12, marginTop: 28 }}>
                <Text style={styles.text2}>INFORMAÇÕES PESSOAIS</Text>
              </View>
              <View style={{ marginTop: 32, gap: 36 }}>
                <InputField
                  placeholder="Nome completo"
                  value={name}
                  status={getFieldStatus("name")}
                  helperText={getFieldHelperText("name")}
                  onChangeText={(value) => {
                    touchField("name");
                    setName(value);
                  }}
                />
                <InputField
                  placeholder="Idade"
                  inputMode="numeric"
                  value={age}
                  status={getFieldStatus("age")}
                  helperText={getFieldHelperText("age")}
                  onChangeText={(value) => {
                    touchField("age");
                    setAge(formatAge(value));
                  }}
                />
                <InputField
                  placeholder="E-mail"
                  inputMode="email"
                  value={email}
                  status={getFieldStatus("email")}
                  helperText={getFieldHelperText("email")}
                  onChangeText={(value) => {
                    touchField("email");
                    setEmail(value.trim());
                  }}
                />
                <InputField
                  placeholder="Estado"
                  value={state}
                  editable={false}
                  showDropdownIndicator
                  status={getFieldStatus("state")}
                  helperText={getFieldHelperText("state")}
                  onPress={() => {
                    touchField("state");
                    setIsStateModalOpen(true);
                  }}
                />
                <InputField
                  placeholder="Cidade"
                  value={city}
                  status={getFieldStatus("city")}
                  helperText={getFieldHelperText("city")}
                  onChangeText={(value) => {
                    touchField("city");
                    setCity(value);
                  }}
                />
                <InputField
                  placeholder="Endereço"
                  value={address}
                  status={getFieldStatus("address")}
                  helperText={getFieldHelperText("address")}
                  onChangeText={(value) => {
                    touchField("address");
                    setAddress(value);
                  }}
                />
                <InputField
                  placeholder="Telefone"
                  inputMode="tel"
                  value={telephone}
                  status={getFieldStatus("telephone")}
                  helperText={getFieldHelperText("telephone")}
                  onChangeText={(value) => {
                    touchField("telephone");
                    setTelephone(formatTelephone(value));
                  }}
                />
              </View>
              <View style={{ marginHorizontal: 12, marginTop: 28 }}>
                <Text style={styles.text2}>INFORMAÇÕES DE PERFIL</Text>
              </View>
              <View style={{ marginTop: 32, gap: 36 }}>
                <InputField
                  placeholder="Nome de usuário"
                  value={username}
                  status={getFieldStatus("username")}
                  helperText={getFieldHelperText("username")}
                  onChangeText={(value) => {
                    touchField("username");
                    setUsername(value);
                  }}
                />
                <InputField
                  placeholder="Senha"
                  value={password}
                  secureTextEntry
                  status={getFieldStatus("password")}
                  helperText={getFieldHelperText("password")}
                  onChangeText={(value) => {
                    touchField("password");
                    setPassword(value);
                  }}
                />
                <InputField
                  placeholder="Confirmação de senha"
                  value={passwordConfirm}
                  secureTextEntry
                  status={getFieldStatus("passwordConfirm")}
                  helperText={getFieldHelperText("passwordConfirm")}
                  onChangeText={(value) => {
                    touchField("passwordConfirm");
                    setPasswordConfirm(value);
                  }}
                />
              </View>
              <View style={{ marginHorizontal: 12, marginTop: 28 }}>
                <Text style={styles.text2}>FOTO DE PERFIL</Text>
              </View>
              <View style={{ alignItems: "center", marginTop: 32 }}>
                {profilePhoto ? (
                  <TouchableOpacity onPress={handleChooseProfileImage}>
                    <Image source={{ uri: profilePhoto.previewUri }} style={styles.profileImagePreview} />
                  </TouchableOpacity>
                ) : (
                  <ImageButton onPress={handleChooseProfileImage} />
                )}
              </View>
              <View style={styles.submitContainer}>
                <AppButton
                  text={isSubmitting ? "FAZENDO CADASTRO..." : "FAZER CADASTRO"}
                  backgroundColor={colors.secondary}
                  textColor={colors.onSecondary}
                  onPress={registerUser}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
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
                    touchField("state");
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    elevation: 4,
    backgroundColor: colors.secondaryContainer,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerMenuButton: {
    margin: 16,
  },
  headerTitleContainer: {
    marginVertical: 16,
    flex: 1,
  },
  headerBackButton: {
    marginHorizontal: 16,
  },
  body: {
    flex: 1,
  },
  text0: {
    textAlign: "left",
    fontFamily: "Roboto_500Medium",
    fontSize: 20,
    color: colors.onSecondaryContainer,
  },
  text1: {
    textAlign: "center",
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: colors.onSecondaryContainer,
  },
  text2: {
    textAlign: "left",
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: colors.secondary,
  },
  profileImagePreview: {
    width: 128,
    height: 128,
    borderRadius: 64,
    resizeMode: "cover",
  },
  submitContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    maxHeight: "70%",
    borderRadius: 12,
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
