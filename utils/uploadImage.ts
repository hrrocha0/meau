import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

export async function uploadImageAsync(uri: string, path: string) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, blob);

  return await getDownloadURL(imageRef);
}