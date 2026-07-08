import React from "react";
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
  const delta = 0.015;
  const src = [
    "https://www.openstreetmap.org/export/embed.html",
    `?bbox=${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`,
    `&layer=mapnik&marker=${latitude},${longitude}`,
  ].join("");

  return (
    <View style={styles.container}>
      {React.createElement("iframe", {
        title,
        src,
        style: iframeStyle,
        loading: "lazy",
      })}
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
    width: "100%",
    height: 180,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#EAEAEA",
  },
});
