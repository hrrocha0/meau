import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Alert, Platform } from "react-native";
import { decodeBase64Image } from "./petImages";

export const PROFILE_IMAGE_SIZE = 64;
const PROFILE_IMAGE_QUALITY = 0.8;

export type ProfilePhoto = {
  base64: string;
  mimeType: string;
  previewUri: string;
  width: number;
  height: number;
};

function getCropArea(width: number, height: number) {
  const side = Math.min(width, height);

  return {
    originX: (width - side) / 2,
    originY: (height - side) / 2,
    width: side,
    height: side,
  };
}

async function normalizeAsset(asset: ImagePicker.ImagePickerAsset): Promise<ProfilePhoto> {
  const sourceWidth = asset.width ?? PROFILE_IMAGE_SIZE;
  const sourceHeight = asset.height ?? PROFILE_IMAGE_SIZE;
  const crop = getCropArea(sourceWidth, sourceHeight);
  const resizedImage = await manipulateAsync(
    asset.uri,
    [
      { crop },
      { resize: { width: PROFILE_IMAGE_SIZE, height: PROFILE_IMAGE_SIZE } },
    ],
    {
      base64: true,
      compress: PROFILE_IMAGE_QUALITY,
      format: SaveFormat.JPEG,
    }
  );

  if (!resizedImage.base64) {
    throw new Error("Não foi possível converter a foto de perfil para base64.");
  }

  const mimeType = "image/jpeg";

  return {
    base64: resizedImage.base64,
    mimeType,
    previewUri: decodeBase64Image(resizedImage.base64, mimeType),
    width: resizedImage.width,
    height: resizedImage.height,
  };
}

async function pickProfilePhoto(source: "camera" | "gallery") {
  const permission = source === "camera"
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert(
      source === "camera"
        ? "Permissão para usar a câmera é necessária."
        : "Permissão para acessar a galeria é necessária."
    );
    return null;
  }

  const result = source === "camera"
    ? await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: PROFILE_IMAGE_QUALITY,
        base64: true,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: PROFILE_IMAGE_QUALITY,
        base64: true,
      });

  if (result.canceled) {
    return null;
  }

  return await normalizeAsset(result.assets[0]);
}

export async function chooseProfilePhoto() {
  if (Platform.OS === "web") {
    return await pickProfilePhoto("gallery");
  }

  return await new Promise<ProfilePhoto | null>((resolve) => {
    Alert.alert("Foto de perfil", "Escolha uma opção", [
      {
        text: "Câmera",
        onPress: async () => {
          resolve(await pickProfilePhoto("camera"));
        },
      },
      {
        text: "Galeria",
        onPress: async () => {
          resolve(await pickProfilePhoto("gallery"));
        },
      },
      {
        text: "Cancelar",
        style: "cancel",
        onPress: () => resolve(null),
      },
    ]);
  });
}
