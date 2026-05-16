import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebaseConfig";
import { decodeBase64Image } from "../../utils/petImages";

type PetDetail = {
  id: string;
  ownerId: string;
  nome: string;
  especie: string;
  sexo: string;
  porte: string;
  idade: string;
  localizacao: string;
  castrado: string;
  vermifugado: string;
  vacinado: string;
  doencas: string;
  temperamento: string;
  exigenciasDoador: string;
  descricao: string;
  imagens: ImageSourcePropType[];
  favorito?: boolean;
};

type AnimalPhotoDocument = {
  base64?: string;
  mimeType?: string;
};

type AnimalDocument = {
  usuarioId?: string;
  nome?: string;
  especie?: string;
  sexo?: string;
  porte?: string;
  faixaEtaria?: string;
  temperamentos?: string[];
  saude?: string[];
  doencas?: string;
  descricao?: string;
  fotoUrl?: string;
  fotos?: AnimalPhotoDocument[];
};

type UserProfileDocument = {
  city?: string;
  state?: string;
};

const TOP_BAR_HEIGHT = 24;
const HEADER_HEIGHT = 56;
const IMAGE_HEIGHT = 184;
const CONTENT_MAX_WIDTH = 360;
const CONTENT_HORIZONTAL_PADDING = 16;
const DIVIDER_COLOR = "#E0E0E0";

function hasHealthFlag(items: string[] | undefined, terms: string[]) {
  return terms.some((term) =>
    (items ?? []).some((item) => item.trim().toLowerCase() === term),
  );
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile } = useAuth();
  const imageListRef = useRef<FlatList<ImageSourcePropType>>(null);
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasAdoptionRequest, setHasAdoptionRequest] = useState(false);
  const { width } = useWindowDimensions();

  const contentWidth = useMemo(
    () => Math.min(width, CONTENT_MAX_WIDTH),
    [width],
  );

  useEffect(() => {
    let isActive = true;

    async function loadPet() {
      if (!id) {
        if (isActive) {
          setPet(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);

        const animalSnapshot = await getDoc(doc(db, "animals", id));

        if (!animalSnapshot.exists()) {
          if (isActive) {
            setPet(null);
          }
          return;
        }

        const animalData = animalSnapshot.data() as AnimalDocument;
        const ownerSnapshot = animalData.usuarioId
          ? await getDoc(doc(db, "users", animalData.usuarioId))
          : null;
        const ownerData = ownerSnapshot?.exists()
          ? (ownerSnapshot.data() as UserProfileDocument)
          : null;

        const imageSourcesFromPhotos = (animalData.fotos ?? [])
          .map((photo) => {
            if (!photo?.base64) {
              return null;
            }

            return {
              uri: decodeBase64Image(
                photo.base64,
                photo.mimeType ?? "image/jpeg",
              ),
            };
          })
          .filter((photo): photo is { uri: string } => Boolean(photo?.uri));

        const imagens =
          imageSourcesFromPhotos.length > 0
            ? imageSourcesFromPhotos
            : animalData.fotoUrl
              ? [{ uri: animalData.fotoUrl }]
              : [require("../../assets/icon.png")];

        const city = ownerData?.city?.trim();
        const state = ownerData?.state?.trim();
        const healthItems = animalData.saude ?? [];
        const temperamentos = (animalData.temperamentos ?? [])
          .map((item) => item.trim())
          .filter(Boolean);

        if (isActive) {
          const nextPet = {
            id: animalSnapshot.id,
            ownerId: animalData.usuarioId?.trim() || "",
            nome: animalData.nome?.trim() || "Sem nome",
            especie: animalData.especie?.trim() || "Não informada",
            sexo: animalData.sexo?.trim() || "Não informado",
            porte: animalData.porte?.trim() || "Não informado",
            idade: animalData.faixaEtaria?.trim() || "Não informada",
            localizacao:
              city && state
                ? `${city} - ${state}`
                : "Localização não informada",
            castrado: hasHealthFlag(healthItems, ["castrado", "castrada"])
              ? "Sim"
              : "Não",
            vermifugado: hasHealthFlag(healthItems, [
              "vermifugado",
              "vermifugada",
            ])
              ? "Sim"
              : "Não",
            vacinado: hasHealthFlag(healthItems, ["vacinado", "vacinada"])
              ? "Sim"
              : "Não",
            doencas: animalData.doencas?.trim() || "Nenhuma informada",
            temperamento:
              temperamentos.length > 0
                ? temperamentos.join(", ")
                : "Não informado",
            exigenciasDoador: "A combinar com o doador responsável.",
            descricao: animalData.descricao?.trim() || "Sem descrição.",
            imagens,
            favorito: false,
          };

          setPet(nextPet);
          setCurrentImageIndex(0);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do pet:", error);
        if (isActive) {
          setPet(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPet();

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!pet?.id || !user?.uid || pet.ownerId === user.uid) {
      setHasAdoptionRequest(false);
      setIsFavorite(false);
      return;
    }

    const conversationId = `${pet.id}_${user.uid}`;
    const unsubscribe = onSnapshot(
      doc(db, "conversa", conversationId),
      (snapshot) => {
        const conversation = snapshot.exists()
          ? (snapshot.data() as { adoptionRequestActive?: boolean })
          : null;
        const isActive = conversation?.adoptionRequestActive ?? false;
        setHasAdoptionRequest(isActive);
        setIsFavorite(isActive);
      },
      (error) => {
        console.error("Erro ao carregar intenção de adoção:", error);
        setHasAdoptionRequest(false);
        setIsFavorite(false);
      },
    );

    return unsubscribe;
  }, [pet?.id, pet?.ownerId, user?.uid]);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/adotar");
  }, []);

  const handleShare = useCallback(async () => {
    if (!pet) {
      return;
    }

    try {
      await Share.share({
        message: `Conheça ${pet.nome}. ${pet.sexo}, ${pet.idade}, ${pet.porte}. ${pet.localizacao}.`,
      });
    } catch {
      Alert.alert("Erro", "Não foi possível compartilhar este pet agora.");
    }
  }, [pet]);

  const handleImageScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / contentWidth,
      );
      setCurrentImageIndex(nextIndex);
    },
    [contentWidth],
  );

  const handleChangeImage = useCallback(
    (direction: "prev" | "next") => {
      if (!pet) {
        return;
      }

      const lastIndex = pet.imagens.length - 1;
      const nextIndex =
        direction === "next"
          ? Math.min(currentImageIndex + 1, lastIndex)
          : Math.max(currentImageIndex - 1, 0);

      imageListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentImageIndex(nextIndex);
    },
    [currentImageIndex, pet],
  );

  const handleAdopt = useCallback(async () => {
    if (!pet || !pet.ownerId) {
      return;
    }

    if (!user?.uid) {
      Alert.alert("Login necessário", "Faça login para demonstrar interesse em adotar.");
      return;
    }

    if (pet.ownerId === user.uid) {
      return;
    }

    const interestedUserName = profile?.username?.trim()
      || profile?.name?.trim()
      || user.email?.split("@")[0]
      || "Alguém";
    const conversationId = `${pet.id}_${user.uid}`;
    const conversationRef = doc(db, "conversa", conversationId);

    try {
      if (hasAdoptionRequest) {
        const cancelMessage = `${interestedUserName} desistiu da adoção de ${pet.nome}.`;

        await addDoc(collection(db, "conversa", conversationId, "mensagens"), {
          senderId: user.uid,
          text: cancelMessage,
          createdAt: serverTimestamp(),
        });

        await updateDoc(conversationRef, {
          adoptionRequestActive: false,
          lastMessage: cancelMessage,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: user.uid,
          interestedLastReadAt: serverTimestamp(),
        });

        return;
      }

      const firstMessage = `${interestedUserName} pretende adotar ${pet.nome}.`;
      const conversationSnapshot = await getDoc(conversationRef);
      const currentConversation = conversationSnapshot.exists()
        ? (conversationSnapshot.data() as { visibleToInterested?: boolean })
        : null;

      await setDoc(conversationRef, {
        animalId: pet.id,
        proprietarioId: pet.ownerId,
        interessadoUserId: user.uid,
        lastMessage: firstMessage,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
        interestedLastReadAt: serverTimestamp(),
        visibleToInterested: currentConversation?.visibleToInterested ?? false,
        adoptionRequestActive: true,
        ...(currentConversation ? {} : { ownerLastReadAt: null }),
      }, { merge: true });

      await addDoc(collection(db, "conversa", conversationId, "mensagens"), {
        senderId: user.uid,
        text: firstMessage,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao registrar intenção de adoção:", error);
      Alert.alert("Erro", "Não foi possível atualizar a intenção de adoção agora.");
    }
  }, [hasAdoptionRequest, pet, profile?.name, profile?.username, user?.email, user?.uid]);

  const handleToggleFavorite = useCallback(() => {
    void handleAdopt();
  }, [handleAdopt]);

  const isOwnPet = pet?.ownerId === user?.uid;
  const adoptionButtonLabel = hasAdoptionRequest
    ? "DESISTO DA ADOÇÃO"
    : "PRETENDO ADOTAR";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#F7A800" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.screen}>
        <View style={styles.topBar} />

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            onPress={handleGoBack}
            style={styles.headerIconButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#434343" />
          </Pressable>

          <Text style={styles.headerTitle}>
            {pet?.nome ?? "Detalhes do pet"}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartilhar pet"
            hitSlop={8}
            onPress={handleShare}
            style={styles.headerIconButton}
          >
            <MaterialIcons name="share" size={24} color="#434343" />
          </Pressable>
        </View>

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isLoading ? (
            <View
              style={[
                styles.contentContainer,
                styles.feedbackContainer,
                { width: contentWidth },
              ]}
            >
              <ActivityIndicator size="small" color="#434343" />
              <Text style={styles.feedbackText}>Carregando pet...</Text>
            </View>
          ) : !pet ? (
            <View
              style={[
                styles.contentContainer,
                styles.feedbackContainer,
                { width: contentWidth },
              ]}
            >
              <Text style={styles.feedbackText}>Pet não encontrado.</Text>
            </View>
          ) : (
            <View style={[styles.contentContainer, { width: contentWidth }]}>
              <View style={styles.imageSection}>
                <FlatList
                  ref={imageListRef}
                  data={pet.imagens}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => `${pet.id}-image-${index}`}
                  onMomentumScrollEnd={handleImageScrollEnd}
                  renderItem={({ item }) => (
                    <Image
                      source={item}
                      resizeMode="cover"
                      style={[styles.heroImage, { width: contentWidth }]}
                    />
                  )}
                />

                <PaginationDots
                  total={pet.imagens.length}
                  currentIndex={currentImageIndex}
                />

                {pet.imagens.length > 1 ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Foto anterior de ${pet.nome}`}
                      disabled={currentImageIndex === 0}
                      onPress={() => handleChangeImage("prev")}
                      style={[
                        styles.carouselButton,
                        styles.carouselButtonLeft,
                        currentImageIndex === 0
                          ? styles.carouselButtonDisabled
                          : null,
                      ]}
                    >
                      <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color="#434343"
                      />
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Próxima foto de ${pet.nome}`}
                      disabled={currentImageIndex === pet.imagens.length - 1}
                      onPress={() => handleChangeImage("next")}
                      style={[
                        styles.carouselButton,
                        styles.carouselButtonRight,
                        currentImageIndex === pet.imagens.length - 1
                          ? styles.carouselButtonDisabled
                          : null,
                      ]}
                    >
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="#434343"
                      />
                    </Pressable>
                  </>
                ) : null}

                {!isOwnPet ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      hasAdoptionRequest
                        ? `Desistir da adoção de ${pet.nome}`
                        : `Pretendo adotar ${pet.nome}`
                    }
                    onPress={handleToggleFavorite}
                    style={styles.favoriteFab}
                  >
                    <MaterialIcons
                      name={isFavorite ? "favorite" : "favorite-border"}
                      size={24}
                      color="#434343"
                    />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.petName}>{pet.nome}</Text>

                <InfoGridRow
                  items={[
                    { label: "SEXO", value: pet.sexo },
                    { label: "PORTE", value: pet.porte },
                    { label: "IDADE", value: pet.idade },
                    { label: "ESPÉCIE", value: pet.especie },
                  ]}
                />

                <View style={styles.locationBlock}>
                  <InfoBlock label="LOCALIZAÇÃO" value={pet.localizacao} />
                </View>

                <Divider />

                <InfoGridRow
                  items={[
                    { label: "CASTRADO", value: pet.castrado },
                    { label: "VERMIFUGADO", value: pet.vermifugado },
                  ]}
                />

                <View style={styles.healthDetailsRow}>
                  <InfoGridRow
                    items={[
                      { label: "VACINADO", value: pet.vacinado },
                      { label: "DOENÇAS", value: pet.doencas },
                    ]}
                  />
                </View>

                <Divider />

                <InfoBlock label="TEMPERAMENTO" value={pet.temperamento} />

                <Divider />

                <InfoBlock
                  label="EXIGÊNCIAS DO DOADOR"
                  value={pet.exigenciasDoador}
                />

                <Divider />

                <InfoBlock
                  label={`MAIS SOBRE ${pet.nome.toUpperCase()}`}
                  value={pet.descricao}
                />

                <View style={styles.ctaWrapper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={adoptionButtonLabel}
                    disabled={isOwnPet}
                    onPress={() => {
                      void handleAdopt();
                    }}
                    style={[
                      styles.ctaButton,
                      isOwnPet ? styles.ctaButtonDisabled : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ctaButtonText,
                        isOwnPet ? styles.ctaButtonTextDisabled : null,
                      ]}
                    >
                      {adoptionButtonLabel}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type PaginationDotsProps = {
  total: number;
  currentIndex: number;
};

const PaginationDots = memo(function PaginationDots({
  total,
  currentIndex,
}: PaginationDotsProps) {
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length: total }).map((_, index) => {
        const active = index === currentIndex;

        return (
          <View
            key={`dot-${index}`}
            style={[styles.dot, active && styles.dotActive]}
          />
        );
      })}
    </View>
  );
});

type InfoItem = {
  label: string;
  value: string;
};

type InfoGridRowProps = {
  items: InfoItem[];
};

const InfoGridRow = memo(function InfoGridRow({ items }: InfoGridRowProps) {
  return (
    <View style={styles.gridRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.gridItem}>
          <Text style={styles.sectionLabel}>{item.label}</Text>
          <Text style={styles.sectionValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
});

type InfoBlockProps = {
  label: string;
  value: string;
};

const InfoBlock = memo(function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionValue}>{value}</Text>
    </View>
  );
});

const Divider = memo(function Divider() {
  return <View style={styles.divider} />;
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7A800",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  topBar: {
    height: TOP_BAR_HEIGHT,
    backgroundColor: "#F7A800",
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: "#FEE29B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "500",
    color: "#434343",
    marginRight: 40,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 28,
  },
  contentContainer: {
    backgroundColor: "#FAFAFA",
  },
  feedbackContainer: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  feedbackText: {
    fontSize: 14,
    color: "#434343",
    textAlign: "center",
  },
  imageSection: {
    position: "relative",
  },
  heroImage: {
    height: IMAGE_HEIGHT,
    backgroundColor: "#EAEAEA",
  },
  carouselButton: {
    position: "absolute",
    top: IMAGE_HEIGHT / 2 - 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(250,250,250,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselButtonLeft: {
    left: 12,
  },
  carouselButtonRight: {
    right: 12,
  },
  carouselButtonDisabled: {
    opacity: 0.45,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
  },
  favoriteFab: {
    position: "absolute",
    right: 16,
    bottom: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  infoContainer: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 16,
  },
  petName: {
    fontFamily: "Roboto_500Medium",
    fontSize: 16,
    fontWeight: "500",
    color: "#434343",
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: "row",
    columnGap: 16,
  },
  gridItem: {
    flex: 1,
  },
  healthDetailsRow: {
    marginTop: 16,
  },
  block: {
    width: "100%",
  },
  locationBlock: {
    marginTop: 16,
  },
  sectionLabel: {
    fontFamily: "Roboto_400Regular",
    fontSize: 12,
    color: "#F7A800",
    marginBottom: 8,
  },
  sectionValue: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    fontWeight: "400",
    color: "#434343",
    lineHeight: 20,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: DIVIDER_COLOR,
    marginVertical: 16,
  },
  ctaWrapper: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 8,
  },
  ctaButton: {
    width: 232,
    height: 40,
    borderRadius: 2,
    backgroundColor: "#FDCF58",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ctaButtonDisabled: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaButtonText: {
    fontFamily: "Roboto_500Medium",
    fontSize: 12,
    color: "#434343",
    fontWeight: "500",
  },
  ctaButtonTextDisabled: {
    color: "#8A8A8A",
  },
});
