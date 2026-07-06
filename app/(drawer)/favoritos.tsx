import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect, useNavigation } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebaseConfig";
import { decodeBase64Image } from "../../utils/petImages";

type Pet = {
  id: string;
  nome: string;
  sexo: string;
  idade: string;
  porte: string;
  localizacao: string;
  imagemUris: string[];
  imagemUri: string;
  favorito: boolean;
};

type AnimalPhotoDocument = {
  base64?: string;
  mimeType?: string;
};

type AnimalDocument = {
  usuarioId?: string;
  nome?: string;
  sexo?: string;
  faixaEtaria?: string;
  porte?: string;
  fotoUrl?: string;
  fotos?: AnimalPhotoDocument[];
  oculto?: boolean;
};

type UserProfileDocument = {
  city?: string;
  state?: string;
};

const HEADER_HEIGHT = 56;
const CARD_GAP = 8;
const CARD_MAX_WIDTH = 344;
const CARD_HEADER_HEIGHT = 32;
const CARD_IMAGE_HEIGHT = 183;
const CARD_TOTAL_HEIGHT = 264;

type DrawerNavigation = {
  openDrawer: () => void;
};

export default function FavoritosScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cardWidth = useMemo(() => {
    const availableWidth = width - CARD_GAP * 2;
    return Math.min(availableWidth, CARD_MAX_WIDTH);
  }, [width]);

  const loadFavoritePets = useCallback(async (isActive: () => boolean) => {
    if (!user?.uid) {
      if (isActive()) {
        setPets([]);
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);

      const favoritesQuery = query(
        collection(db, "users", user.uid, "favorites"),
        orderBy("createdAt", "desc"),
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteIds = favoritesSnapshot.docs.map((favoriteDoc) => favoriteDoc.id);

      if (favoriteIds.length === 0) {
        if (isActive()) {
          setPets([]);
        }
        return;
      }

      const animalEntries = await Promise.all(
        favoriteIds.map(async (animalId) => {
          const animalSnapshot = await getDoc(doc(db, "animals", animalId));

          if (!animalSnapshot.exists()) {
            return null;
          }

          return {
            id: animalSnapshot.id,
            ...(animalSnapshot.data() as AnimalDocument),
          };
        }),
      );
      const animals = animalEntries.filter((animal): animal is AnimalDocument & { id: string } => (
        Boolean(animal) && animal?.oculto !== true
      ));

      const ownerIds = [...new Set(animals.map((animal) => animal.usuarioId).filter(Boolean))] as string[];
      const ownerEntries = await Promise.all(
        ownerIds.map(async (ownerId) => {
          const ownerSnapshot = await getDoc(doc(db, "users", ownerId));
          return [ownerId, ownerSnapshot.exists() ? (ownerSnapshot.data() as UserProfileDocument) : null] as const;
        }),
      );

      const ownersById = new Map(ownerEntries);
      const nextPets = animals.map((animal) => {
        const ownerProfile = animal.usuarioId ? ownersById.get(animal.usuarioId) : null;
        const city = ownerProfile?.city?.trim();
        const state = ownerProfile?.state?.trim();
        const localizacao = city && state
          ? `${city.toUpperCase()} - ${state.toUpperCase()}`
          : "LOCALIZAÇÃO NÃO INFORMADA";
        const imageUrisFromPhotos = (animal.fotos ?? [])
          .map((photo) => {
            if (!photo?.base64) {
              return null;
            }

            return decodeBase64Image(photo.base64, photo.mimeType ?? "image/jpeg");
          })
          .filter((photoUri): photoUri is string => Boolean(photoUri));
        const imagemUris = imageUrisFromPhotos.length > 0
          ? imageUrisFromPhotos
          : (animal.fotoUrl ? [animal.fotoUrl] : []);

        return {
          id: animal.id,
          nome: animal.nome?.trim() || "Sem nome",
          sexo: (animal.sexo || "Não informado").toUpperCase(),
          idade: (animal.faixaEtaria || "Não informada").toUpperCase(),
          porte: (animal.porte || "Não informado").toUpperCase(),
          localizacao,
          imagemUris,
          imagemUri: imagemUris[0] || "",
          favorito: true,
        };
      });

      if (isActive()) {
        setPets(nextPets);
      }
    } catch (error) {
      console.error("Erro ao carregar pets favoritos:", error);
      if (isActive()) {
        setPets([]);
      }
    } finally {
      if (isActive()) {
        setIsLoading(false);
      }
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void loadFavoritePets(() => isActive);

      return () => {
        isActive = false;
      };
    }, [loadFavoritePets]),
  );

  const handleOpenDrawer = useCallback(() => {
    (navigation as unknown as DrawerNavigation).openDrawer();
  }, [navigation]);

  const handleOpenPet = useCallback((pet: Pet) => {
    router.push(`/animal/${pet.id}` as any);
  }, []);

  const handleRemoveFavorite = useCallback(async (pet: Pet) => {
    if (!user?.uid) {
      return;
    }

    setPets((currentPets) => currentPets.filter((currentPet) => currentPet.id !== pet.id));

    try {
      await deleteDoc(doc(db, "users", user.uid, "favorites", pet.id));
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      setPets((currentPets) => [pet, ...currentPets]);
      Alert.alert("Erro", "Não foi possível remover este pet dos favoritos agora.");
    }
  }, [user?.uid]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Pet>) => (
      <PetCard
        pet={item}
        width={cardWidth}
        onPress={handleOpenPet}
        onRemoveFavorite={handleRemoveFavorite}
      />
    ),
    [cardWidth, handleOpenPet, handleRemoveFavorite],
  );

  const keyExtractor = useCallback((item: Pet) => item.id, []);

  const itemSeparator = useCallback(
    () => <View style={{ height: CARD_GAP }} />,
    [],
  );

  const emptyText = user
    ? "Nenhum pet favorito ainda."
    : "Entre na sua conta para ver seus favoritos.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFD358" />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            hitSlop={8}
            onPress={handleOpenDrawer}
            style={styles.headerIconButton}
          >
            <MaterialIcons name="menu" size={24} color="#434343" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Favoritos</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir para adoção"
            hitSlop={8}
            onPress={() => router.push("/adotar")}
            style={styles.headerIconButton}
          >
            <MaterialIcons name="pets" size={24} color="#434343" />
          </Pressable>
        </View>

        <FlatList
          data={pets}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={itemSeparator}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.feedbackContainer}>
                <ActivityIndicator size="small" color="#434343" />
                <Text style={styles.feedbackText}>Carregando favoritos...</Text>
              </View>
            ) : (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackText}>{emptyText}</Text>
                {!user ? (
                  <Pressable style={styles.loginButton} onPress={() => router.push("/login")}>
                    <Text style={styles.loginButtonText}>ENTRAR</Text>
                  </Pressable>
                ) : null}
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

type PetCardProps = {
  pet: Pet;
  width: number;
  onPress: (pet: Pet) => void;
  onRemoveFavorite: (pet: Pet) => void;
};

const PetCard = memo(function PetCard({ pet, width, onPress, onRemoveFavorite }: PetCardProps) {
  const imageListRef = useRef<FlatList<string>>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageUris = pet.imagemUris.length > 0
    ? pet.imagemUris
    : [""];

  const handlePress = useCallback(() => {
    onPress(pet);
  }, [onPress, pet]);

  const handleImageScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(nextIndex);
  }, [width]);

  const handleChangeImage = useCallback((direction: "prev" | "next") => {
    const lastIndex = imageUris.length - 1;
    const nextIndex = direction === "next"
      ? Math.min(currentImageIndex + 1, lastIndex)
      : Math.max(currentImageIndex - 1, 0);

    imageListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
    setCurrentImageIndex(nextIndex);
  }, [currentImageIndex, imageUris.length]);

  return (
    <View style={[styles.cardWrapper, { width, minHeight: CARD_TOTAL_HEIGHT }]}>
      <View style={styles.cardHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir perfil do animal ${pet.nome}`}
          onPress={handlePress}
          style={styles.cardTitleButton}
        >
          <Text style={styles.cardTitle}>{pet.nome}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Desfavoritar ${pet.nome}`}
          hitSlop={8}
          onPress={() => onRemoveFavorite(pet)}
          style={styles.favoriteButton}
        >
          <MaterialIcons name="favorite" size={24} color="#434343" />
        </Pressable>
      </View>

      <View style={styles.carouselWrapper}>
        <FlatList
          ref={imageListRef}
          data={imageUris}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${pet.id}-${index}-${item.length}`}
          onMomentumScrollEnd={handleImageScrollEnd}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil do animal ${pet.nome}`}
              onPress={handlePress}
            >
              <Image
                source={
                  item
                    ? { uri: item }
                    : require("../../assets/icon.png")
                }
                resizeMode="cover"
                style={[styles.cardImage, { width }]}
              />
            </Pressable>
          )}
        />

        {imageUris.length > 1 ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Foto anterior de ${pet.nome}`}
              disabled={currentImageIndex === 0}
              onPress={() => handleChangeImage("prev")}
              style={[
                styles.carouselButton,
                styles.carouselButtonLeft,
                currentImageIndex === 0 ? styles.carouselButtonDisabled : null,
              ]}
            >
              <MaterialIcons name="chevron-left" size={24} color="#434343" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Próxima foto de ${pet.nome}`}
              disabled={currentImageIndex === imageUris.length - 1}
              onPress={() => handleChangeImage("next")}
              style={[
                styles.carouselButton,
                styles.carouselButtonRight,
                currentImageIndex === imageUris.length - 1 ? styles.carouselButtonDisabled : null,
              ]}
            >
              <MaterialIcons name="chevron-right" size={24} color="#434343" />
            </Pressable>

            <View style={styles.carouselDots}>
              {imageUris.map((_, index) => (
                <View
                  key={`${pet.id}-dot-${index}`}
                  style={[
                    styles.carouselDot,
                    index === currentImageIndex ? styles.carouselDotActive : null,
                  ]}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir perfil do animal ${pet.nome}`}
        onPress={handlePress}
        style={styles.cardFooter}
      >
        <View style={styles.badgesRow}>
          <Text style={styles.metaText}>{pet.sexo}</Text>
          <Text style={styles.metaText}>{pet.idade}</Text>
          <Text style={styles.metaText}>{pet.porte}</Text>
        </View>

        <Text numberOfLines={1} style={styles.locationText}>
          {pet.localizacao}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFD358",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: "#FFD358",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(67,67,67,0.18)",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    color: "#434343",
    fontWeight: "500",
  },
  listContent: {
    padding: CARD_GAP,
    alignItems: "center",
    flexGrow: 1,
    paddingBottom: 24,
  },
  feedbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  feedbackText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: "#434343",
    textAlign: "center",
  },
  loginButton: {
    minHeight: 44,
    minWidth: 120,
    backgroundColor: "#88C9BF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loginButtonText: {
    fontFamily: "Roboto_500Medium",
    fontSize: 13,
    color: "#434343",
  },
  cardWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    height: CARD_HEADER_HEIGHT,
    backgroundColor: "#FEE29B",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 4,
  },
  cardTitleButton: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
  },
  carouselWrapper: {
    position: "relative",
  },
  cardTitle: {
    fontFamily: "Roboto_500Medium",
    fontSize: 16,
    lineHeight: 16,
    color: "#434343",
    fontWeight: "500",
  },
  favoriteButton: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImage: {
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: "#EAEAEA",
  },
  carouselButton: {
    position: "absolute",
    top: CARD_IMAGE_HEIGHT / 2 - 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselButtonLeft: {
    left: 8,
  },
  carouselButtonRight: {
    right: 8,
  },
  carouselButtonDisabled: {
    opacity: 0.45,
  },
  carouselDots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  carouselDotActive: {
    backgroundColor: "#FFFFFF",
  },
  cardFooter: {
    minHeight: CARD_TOTAL_HEIGHT - CARD_HEADER_HEIGHT - CARD_IMAGE_HEIGHT,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: "center",
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  metaText: {
    fontFamily: "Roboto_400Regular",
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#434343",
  },
  locationText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 12,
    color: "#434343",
    textAlign: "center",
    fontWeight: "400",
  },
});
