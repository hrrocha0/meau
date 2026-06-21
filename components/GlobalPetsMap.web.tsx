import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants";
import type { PetPin } from "../hooks/usaPetsproximos";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type GlobalPetsMapProps = {
  pets: PetPin[];
  userLocation: Coordinates;
  onSelectPet: (pet: PetPin) => void;
};

export function GlobalPetsMap({
  pets,
  userLocation,
  onSelectPet,
}: GlobalPetsMapProps) {
  const delta = 0.45;
  const src = [
    "https://www.openstreetmap.org/export/embed.html",
    `?bbox=${userLocation.longitude - delta},${userLocation.latitude - delta},${userLocation.longitude + delta},${userLocation.latitude + delta}`,
    `&layer=mapnik&marker=${userLocation.latitude},${userLocation.longitude}`,
  ].join("");

  return (
    <View style={styles.container}>
      {React.createElement("iframe", {
        title: "Mapa de animais próximos",
        src,
        style: iframeStyle,
        loading: "lazy",
      })}

      <ScrollView
        horizontal
        style={styles.petStrip}
        contentContainerStyle={styles.petStripContent}
        showsHorizontalScrollIndicator={false}
      >
        {pets.map((pet) => (
          <Pressable
            key={pet.id}
            style={styles.petCard}
            onPress={() => onSelectPet(pet)}
          >
            {pet.imagemUri ? (
              <Image source={{ uri: pet.imagemUri }} style={styles.petImage} />
            ) : (
              <View style={styles.petFallback}>
                <Text style={styles.petEmoji}>
                  {pet.especie?.toLowerCase().includes("gato") ? "🐱" : "🐶"}
                </Text>
              </View>
            )}
            <View style={styles.petInfo}>
              <Text style={styles.petName} numberOfLines={1}>
                {pet.nome}
              </Text>
              <Text style={styles.petSpecies} numberOfLines={1}>
                {pet.especie}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const iframeStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: 0,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEAEA",
  },
  petStrip: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 116,
    maxHeight: 72,
  },
  petStripContent: {
    gap: 8,
    paddingRight: 4,
  },
  petCard: {
    width: 176,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  petImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  petFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary + "18",
  },
  petEmoji: {
    fontSize: 22,
  },
  petInfo: {
    flex: 1,
    minWidth: 0,
  },
  petName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.onSurface,
  },
  petSpecies: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },
});
