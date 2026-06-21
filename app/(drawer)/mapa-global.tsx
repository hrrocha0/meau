import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useNearbyPets, PetPin } from "../../hooks/usaPetsproximos";
import { colors } from "../../constants";
import { GlobalPetsMap } from "../../components/GlobalPetsMap";

export default function MapaGlobal() {
  const { pets, userLocation, loading, error } = useNearbyPets(50);
  const [selecionado, setSelecionado] = useState<PetPin | null>(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Buscando animais próximos…</Text>
      </View>
    );
  }

  if (error || !userLocation) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "Localização indisponível."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GlobalPetsMap
        pets={pets}
        userLocation={userLocation}
        onSelectPet={setSelecionado}
      />

      {/* Header sobreposto */}
      <SafeAreaView style={styles.header} edges={["top"]}>
        <Text style={styles.headerTitle}>
          {pets.length} {pets.length === 1 ? "animal" : "animais"} próximos
        </Text>
      </SafeAreaView>

      {/* Bottom sheet ao clicar num animal */}
      {selecionado && (
        <View style={styles.bottomSheet}>
          {selecionado.imagemUri && (
            <Image
              source={{ uri: selecionado.imagemUri }}
              style={styles.sheetImg}
            />
          )}
          <View style={styles.sheetInfo}>
            <Text style={styles.sheetNome}>{selecionado.nome}</Text>
            <Text style={styles.sheetEspecie}>{selecionado.especie}</Text>
          </View>
          <View style={styles.sheetBtns}>
            <Pressable
              style={styles.btnVer}
              onPress={() => router.push(`/animal/${selecionado.id}`)}
            >
              <Text style={styles.btnVerText}>Ver detalhes</Text>
            </Pressable>
            <Pressable
              style={styles.btnFechar}
              onPress={() => setSelecionado(null)}
            >
              <Text style={styles.btnFecharText}>✕</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: colors.onSurface, fontSize: 14 },
  errorText: { color: "red", fontSize: 14, textAlign: "center", paddingHorizontal: 24 },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  headerTitle: { fontSize: 15, fontWeight: "500", color: colors.onSurface },

  bottomSheet: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sheetImg: { width: 56, height: 56, borderRadius: 8 },
  sheetInfo: { flex: 1 },
  sheetNome: { fontSize: 16, fontWeight: "500", color: colors.onSurface },
  sheetEspecie: { fontSize: 13, color: "#888", marginTop: 2 },
  sheetBtns: { flexDirection: "column", gap: 6 },
  btnVer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnVerText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  btnFechar: { alignItems: "center", padding: 6 },
  btnFecharText: { color: "#999", fontSize: 16 },
});
