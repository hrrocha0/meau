import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export const MAX_PET_PHOTOS = 5;
export const PET_PHOTO_WIDTH = 344;
export const PET_PHOTO_HEIGHT = 183;
const PET_PHOTO_QUALITY = 0.65;

export type PetPhoto = {
  id: string;
  base64: string;
  mimeType: string;
  previewUri: string;
  width: number;
  height: number;
};

export function encodeBase64Image(base64: string, mimeType = "image/jpeg") {
  return `data:${mimeType};base64,${base64}`;
}

export function decodeBase64Image(base64OrDataUri: string, mimeType = "image/jpeg") {
  if (base64OrDataUri.startsWith("data:")) {
    return base64OrDataUri;
  }

  return encodeBase64Image(base64OrDataUri, mimeType);
}

function getCropArea(width: number, height: number) {
  const sourceRatio = width / height;
  const targetRatio = PET_PHOTO_WIDTH / PET_PHOTO_HEIGHT;

  if (sourceRatio > targetRatio) {
    const cropWidth = height * targetRatio;
    return {
      originX: (width - cropWidth) / 2,
      originY: 0,
      width: cropWidth,
      height,
    };
  }

  const cropHeight = width / targetRatio;
  return {
    originX: 0,
    originY: (height - cropHeight) / 2,
    width,
    height: cropHeight,
  };
}

async function normalizeAsset(asset: ImagePicker.ImagePickerAsset): Promise<PetPhoto> {
  const sourceWidth = asset.width ?? PET_PHOTO_WIDTH;
  const sourceHeight = asset.height ?? PET_PHOTO_HEIGHT;
  const crop = getCropArea(sourceWidth, sourceHeight);
  const resizedImage = await manipulateAsync(
    asset.uri,
    [
      { crop },
      { resize: { width: PET_PHOTO_WIDTH, height: PET_PHOTO_HEIGHT } },
    ],
    {
      base64: true,
      compress: PET_PHOTO_QUALITY,
      format: SaveFormat.JPEG,
    },
  );

  if (!resizedImage.base64) {
    throw new Error("Não foi possível converter a foto do animal para base64.");
  }

  const mimeType = "image/jpeg";
  const previewUri = decodeBase64Image(resizedImage.base64, mimeType);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    base64: resizedImage.base64,
    mimeType,
    previewUri,
    width: resizedImage.width,
    height: resizedImage.height,
  };
}

export async function pickPetPhotosFromGallery(currentCount: number) {
  const remainingPhotos = MAX_PET_PHOTOS - currentCount;

  if (remainingPhotos <= 0) {
    return [];
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Permissão para acessar a galeria é necessária.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: remainingPhotos === 1,
    allowsMultipleSelection: remainingPhotos > 1,
    selectionLimit: remainingPhotos,
    aspect: [PET_PHOTO_WIDTH, PET_PHOTO_HEIGHT],
    quality: PET_PHOTO_QUALITY,
    base64: true,
  });

  if (result.canceled) {
    return null;
  }

  const selectedAssets = result.assets.slice(0, remainingPhotos);
  return await Promise.all(selectedAssets.map(normalizeAsset));
}

export async function pickPetPhotoFromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    alert("Permissão para usar a câmera é necessária.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [PET_PHOTO_WIDTH, PET_PHOTO_HEIGHT],
    quality: PET_PHOTO_QUALITY,
    base64: true,
  });

  if (result.canceled) {
    return null;
  }

  return await Promise.all(result.assets.slice(0, 1).map(normalizeAsset));
}
