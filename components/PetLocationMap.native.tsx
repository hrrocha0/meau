import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View } from "react-native";

type PetLocationMapProps = {
  latitude: number;
  longitude: number;
  title: string;
};

export function PetLocationMap({
  latitude,
  longitude,
  title,
}: PetLocationMapProps) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#EAEAEA",
  },
  map: {
    flex: 1,
  },
});
