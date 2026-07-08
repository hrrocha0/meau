import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as Location from "expo-location";
import { db } from "@/firebaseConfig";

export type PetPin = {
  id: string;
  nome: string;
  especie: string;
  latitude: number;
  longitude: number;
  imagemUri?: string;
};

function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Desloca a coordenada em até `raioMetros` em direção aleatória
function aproximarCoordenada(valor: number, raioMetros: number): number {
  const delta = (Math.random() * 2 - 1) * (raioMetros / 111320);
  return valor + delta;
}

export function useNearbyPets(raioKm = 50) {
  const [pets, setPets] = useState<PetPin[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permissão de localização negada.");
          setLoading(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });

        const snap = await getDocs(query(collection(db, "animals"), where("oculto", "!=", true)));

        const resultado: PetPin[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (typeof d.latitude === "number" && typeof d.longitude === "number") {
            const dist = distanciaKm(latitude, longitude, d.latitude, d.longitude);
            if (dist <= raioKm) {
              resultado.push({
                id: doc.id,
                nome: d.nome ?? "Sem nome",
                especie: d.especie ?? "",
                latitude: aproximarCoordenada(d.latitude, 500),
                longitude: aproximarCoordenada(d.longitude, 500),
                imagemUri: d.fotos?.[0]?.base64 ? `data:${d.fotos[0].mimeType};base64,${d.fotos[0].base64}` : undefined,
              });
            }
          }
        });
        setPets(resultado);
      } catch (e) {
        setError("Erro ao carregar animais.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [raioKm]);

  return { pets, userLocation, loading, error };
}
