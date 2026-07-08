import Ionicons from "@expo/vector-icons/Ionicons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DrawerMenuContent from "@/src/components/DrawerMenuContent";
import { auth } from "@/firebaseConfig";
import * as Notifications from "expo-notifications";

const CORES = {
  verdeHeader: "#88c9bf",
  verdeBotao: "#88c9bf",
  cinzaTexto: "#575757",
  cinzaInput: "#bdbdbd",
  azulFace: "#194f7c",
  vermelhoGoogle: "#f15f5c",
  fundo: "#fafafa",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fazerLogin = async () => {
    if (email === "" || senha === "") {
      alert("Por favor, preencha e-mail e senha.");
      return;
    }

    console.log("Tentando fazer login com:", email); // Vai mostrar no console

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      console.log("Deu certo!", userCredential.user);

      if (Platform.OS !== "web") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Sucesso!",
            body: "Seja bem-vindo(a) de volta!",
          },
          trigger: null,
        });
      }

      router.replace("/(drawer)");
    } catch (error: any) {
      alert(`Erro no Login: ${error.message}`);
      console.error("Erro completo do Firebase:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Modal visible={isMenuOpen} animationType="slide" transparent onRequestClose={() => setIsMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsMenuOpen(false)}>
          <Pressable style={styles.drawer} onPress={() => {}}>
            <DrawerMenuContent onClose={() => setIsMenuOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsMenuOpen(true)} accessibilityLabel="Abrir menu">
          <Ionicons name="menu" size={24} color={CORES.cinzaTexto} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Login</Text>
        <TouchableOpacity onPress={() => router.push("/(drawer)")} accessibilityLabel="Voltar para home">
          <Ionicons name="arrow-back" size={24} color={CORES.cinzaTexto} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Nome de usuário (E-mail)"
          placeholderTextColor={CORES.cinzaInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={CORES.cinzaInput}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.botaoEntrar} onPress={fazerLogin}>
          <Text style={styles.botaoText}>ENTRAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flexDirection: "row",
  },
  drawer: {
    width: "78%",
    maxWidth: 320,
    backgroundColor: "#F7F7F7",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    height: 80,
    backgroundColor: CORES.verdeHeader,
    paddingTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    elevation: 4,
  },
  headerTitle: { fontSize: 20, color: CORES.cinzaTexto, fontWeight: "500", marginLeft: 10 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 40, alignItems: "center" },
  input: {
    width: "100%",
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: CORES.cinzaInput,
    marginBottom: 20,
    fontSize: 16,
    color: CORES.cinzaTexto,
    paddingHorizontal: 5,
  },
  botaoEntrar: {
    width: "100%",
    height: 50,
    backgroundColor: CORES.verdeBotao,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 50,
    elevation: 2,
  },
  botaoText: { color: CORES.cinzaTexto, fontSize: 14, fontWeight: "bold" },
  socialContainer: { width: "100%", gap: 10 },
  botaoSocial: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  iconSocial: { marginRight: 15 },
  botaoTextSocial: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});
