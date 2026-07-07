import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Meau",
  slug: "meau",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "cover",
    backgroundColor: "white",
  },
  scheme: "meau",
  owner: "meau-2026-1",
  android: {
    package: "com.appunb.meau",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#F5A900",
    },
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  extra: {
    eas: {
      projectId: "0e8c7703-959d-4d80-91c9-b700b5cd9131",
    },
  },
};

export default config;
