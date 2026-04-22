import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function CustomDrawerContent(
  props: DrawerContentComponentProps,
) {
  const [openSections, setOpenSections] = useState({
    perfil: true,
    atalhos: true,
    informacoes: true,
    configuracoes: true,
  });

  function goTo(path: string) {
    props.navigation.closeDrawer();
    router.push(path as any);
  }

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerScroll}
      contentContainerStyle={styles.scrollContent}
      scrollEnabled={false}
    >
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://i.pravatar.cc/150?img=32",
          }}
          style={styles.avatar}
        />
      </View>

      <DropdownSection
        title="Nome do perfil"
        color="#88C9BF"
        isOpen={openSections.perfil}
        onPress={() => toggleSection("perfil")}
      >
        <MenuItem label="Meu perfil" onPress={() => goTo("/meu-perfil")} />
        <MenuItem label="Meus pets" onPress={() => goTo("/meus-pets")} />
        <MenuItem label="Favoritos" onPress={() => goTo("/favoritos")} />
        <MenuItem label="Chat" onPress={() => goTo("/chat")} />
      </DropdownSection>

      <DropdownSection
        color="#FEE29B"
        icon={<MaterialIcons name="pets" size={22} color="#757575" />}
        title="Atalhos"
        isOpen={openSections.atalhos}
        onPress={() => toggleSection("atalhos")}
      >
        <MenuItem
          label="Cadastrar um pet"
          onPress={() => goTo("/cadastro-aviso")}
        />
        <MenuItem label="Adotar um pet" onPress={() => goTo("/(drawer)")} />
        <MenuItem label="Ajudar um pet" onPress={() => goTo("/(drawer)")} />
        <MenuItem label="Apadrinhar um pet" onPress={() => goTo("/(drawer)")} />
      </DropdownSection>

      <DropdownSection
        color="#CFE9E5"
        icon={
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#757575"
          />
        }
        title="Informações"
        isOpen={openSections.informacoes}
        onPress={() => toggleSection("informacoes")}
      >
        <MenuItem label="Dicas" onPress={() => goTo("/(drawer)")} />
        <MenuItem label="Eventos" onPress={() => goTo("/(drawer)")} />
        <MenuItem label="Legislação" onPress={() => goTo("/(drawer)")} />
        <MenuItem label="Termo de adoção" onPress={() => goTo("/(drawer)")} />
      </DropdownSection>

      <DropdownSection
        color="#E6E7E8"
        icon={<Ionicons name="settings-outline" size={22} color="#757575" />}
        title="Configurações"
        isOpen={openSections.configuracoes}
        onPress={() => toggleSection("configuracoes")}
      >
        <MenuItem label="Privacidade" onPress={() => goTo("/(drawer)")} />
      </DropdownSection>

      <Pressable
        style={styles.logoutButton}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </DrawerContentScrollView>
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
      <Pressable
        style={[styles.sectionHeader, { backgroundColor: color }]}
        onPress={onPress}
      >
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

function MenuItem({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
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
    margin: 0,
    padding: 0,
    backgroundColor: "#F7F7F7",
  },
  scrollContent: {
    flexGrow: 1,
    margin: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
    paddingEnd: 0,
    paddingStart: 0,
    backgroundColor: "#F7F7F7",
  },
  header: {
    backgroundColor: "#88C9BF",
    height: 172,
    paddingHorizontal: 16,
    paddingTop: 40,
    justifyContent: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 14,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#434343",
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
    marginLeft: 12,
  },
  menuItem: {
    paddingHorizontal: 16,
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
    marginLeft: 48,
  },
  logoutButton: {
    marginTop: 16,
    minHeight: 48,
    backgroundColor: "#88C9BF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 14,
    color: "#434343",
    fontWeight: "500",
  },
});
