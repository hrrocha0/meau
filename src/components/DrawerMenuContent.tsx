import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { decodeBase64Image } from "../utils/petImages";

type DrawerMenuContentProps = {
  onClose?: () => void;
};

export default function DrawerMenuContent({ onClose = () => {} }: DrawerMenuContentProps) {
  const { logout, profile, user } = useAuth();
  const isLoggedIn = !!user;
  const [openSections, setOpenSections] = useState({
    conta: true,
    atalhos: true,
    informacoes: true,
    configuracoes: true,
  });

  function goTo(path: string) {
    onClose();
    router.navigate(path);
  }

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  async function handleLogout() {
    if (!isLoggedIn) {
      return;
    }
    try {
      await logout();
      onClose();
      router.navigate("/login");
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    }
  }

  const profileName = profile?.username ?? profile?.name ?? user?.email?.split("@")[0] ?? "Visitante";
  const profilePhotoUri = profile?.profilePhoto?.base64
    ? decodeBase64Image(profile.profilePhoto.base64, profile.profilePhoto.mimeType ?? "image/jpeg")
    : null;

  return (
    <ScrollView
      style={styles.drawerScroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          {isLoggedIn && profilePhotoUri ? (
            <Image source={{ uri: profilePhotoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={30} color="#434343" />
            </View>
          )}
          <Text style={styles.headerTitle}>{profileName}</Text>
          <Text style={styles.headerSubtitle}>
            {isLoggedIn ? "" : "Entre ou crie sua conta para cadastrar e acompanhar pets."}
          </Text>
        </View>

        <DropdownSection
          title={isLoggedIn ? "Minha conta" : "Acesso"}
          color="#88C9BF"
          isOpen={openSections.conta}
          onPress={() => toggleSection("conta")}
        >
          {isLoggedIn ? (
            <>
              <MenuItem label="Meu perfil" onPress={() => goTo("/meu-perfil")} />
              <MenuItem label="Meus pets" onPress={() => goTo("/meus-pets")} />
              <MenuItem label="Favoritos" onPress={() => goTo("/favoritos")} />
              <MenuItem label="Chat" onPress={() => goTo("/chat")} />
              <MenuItem label="Mapa" onPress={() => goTo("/mapa-global")} />
            </>
          ) : (
            <>
              <MenuItem label="Entrar" onPress={() => goTo("/login")} />
              <MenuItem label="Criar conta" onPress={() => goTo("/signup")} />
            </>
          )}
        </DropdownSection>

        <DropdownSection
          color="#FEE29B"
          icon={<MaterialIcons name="pets" size={24} color="#757575" />}
          title="Atalhos"
          isOpen={openSections.atalhos}
          onPress={() => toggleSection("atalhos")}
        >
          {isLoggedIn ? (
            <MenuItem label="Cadastrar um pet" onPress={() => goTo("/register-animal")} />
          ) : (
            <MenuItem label="Cadastrar um pet" onPress={() => goTo("/login")} />
          )}
          <MenuItem label="Adotar um pet" onPress={() => goTo("/adotar")} />
          <MenuItem label="Ajudar um pet" onPress={() => goTo("/em-breve")} />
          <MenuItem label="Apadrinhar um pet" onPress={() => goTo("/(drawer)/em-breve")} />
        </DropdownSection>

        <DropdownSection
          color="#CFE9E5"
          icon={<Ionicons name="information-circle-outline" size={24} color="#757575" />}
          title="Informações"
          isOpen={openSections.informacoes}
          onPress={() => toggleSection("informacoes")}
        >
          <MenuItem label="Dicas" onPress={() => goTo("/em-breve")} />
          <MenuItem label="Eventos" onPress={() => goTo("/em-breve")} />
          <MenuItem label="Legislação" onPress={() => goTo("/em-breve")} />
          <MenuItem label="Termo de adoção" onPress={() => goTo("/em-breve")} />
        </DropdownSection>

        <DropdownSection
          color="#E6E7E8"
          icon={<Ionicons name="settings-outline" size={24} color="#757575" />}
          title="Configurações"
          isOpen={openSections.configuracoes}
          onPress={() => toggleSection("configuracoes")}
        >
          <MenuItem label="Privacidade" onPress={() => goTo("/em-breve")} />
        </DropdownSection>

        {isLoggedIn ? (
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function DropdownSection({
  title,
  color,
  icon,
  isOpen,
  onPress,
  children,
}: {
  title: string;
  color: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Pressable style={[styles.sectionHeader, { backgroundColor: color }]} onPress={onPress}>
        {icon ? <View style={styles.sectionIcon}>{icon}</View> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#757575"
          style={{ marginLeft: "auto" }}
        />
      </Pressable>
      {isOpen ? children : null}
    </View>
  );
}

function MenuItem({ label, onPress, icon }: { label: string; onPress: () => void; icon?: React.ReactNode }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        {icon ? <View style={styles.iconBox}>{icon}</View> : null}
        <Text style={styles.menuText}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  drawerScroll: {
    flex: 1,
    margin: 0,
    padding: 0,
    backgroundColor: "#F7F7F7",
  },
  scrollContent: {
    margin: 0,
    paddingTop: 0,
    paddingBottom: 24,
    paddingHorizontal: 0,
    paddingStart: 0,
    paddingEnd: 0,
    backgroundColor: "#F7F7F7",
  },
  content: {
    minHeight: "100%",
  },
  header: {
    backgroundColor: "#88C9BF",
    minHeight: 172,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
  headerTitle: {
    fontFamily: "Roboto_500Medium",
    fontSize: 16,
    color: "#434343",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontFamily: "Roboto_400Regular",
    fontSize: 13,
    color: "#434343",
    lineHeight: 18,
  },
  sectionHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sectionIcon: {
    width: 24,
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    color: "#434343",
    marginLeft: 24,
  },
  menuItem: {
    paddingStart: 48,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E7E8",
    backgroundColor: "#F7F7F7",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 24,
    marginRight: 12,
    alignItems: "center",
  },
  menuText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: "#434343",
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "#88c9bf",
  },
  logoutText: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    color: "#434343",
  },
});
