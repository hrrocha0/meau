import { Image, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { colors } from "../../constants";
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

export function GlobalPetsMap({ pets, userLocation, onSelectPet }: GlobalPetsMapProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.9,
        longitudeDelta: 0.9,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      <Circle
        center={userLocation}
        radius={50000}
        strokeColor={colors.primary + "80"}
        fillColor={colors.primary + "10"}
      />

      {pets.map((pet) => (
        <Marker
          key={pet.id}
          coordinate={{ latitude: pet.latitude, longitude: pet.longitude }}
          onPress={() => onSelectPet(pet)}
        >
          <View style={styles.pin}>
            {pet.imagemUri ? (
              <Image source={{ uri: pet.imagemUri }} style={styles.pinImg} />
            ) : (
              <Text style={styles.pinEmoji}>{pet.especie?.toLowerCase().includes("gato") ? "🐱" : "🐶"}</Text>
            )}
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  pinImg: { width: 40, height: 40 },
  pinEmoji: { fontSize: 22 },
});
