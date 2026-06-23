import React, { useCallback, useMemo, useState } from "react";
import { Alert, ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useNavigation } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { ConversaChatListItem } from "@/components/chat/ConversaChatListItem";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebaseConfig";
import { decodeBase64Image } from "@/utils/petImages";
import { ChatConversationDocument, ConversaChat, UserProfileChatDocument } from "@/types/chat";
import { notifyAdoptionFinished } from "@/services/notifications";

const TOP_BAR_HEIGHT = 24;
const HEADER_HEIGHT = 56;

type ChatTab = "owner" | "interested" | "finished";

const CHAT_TABS: Array<{ key: ChatTab; label: string }> = [
  { key: "owner", label: "Meus pets" },
  { key: "interested", label: "Quero adotar" },
  { key: "finished", label: "Finalizados" },
];

type DrawerNavigation = {
  openDrawer: () => void;
};

type AnimalDocument = {
  usuarioId?: string;
  nome?: string;
};

function formatLastMessageTime(value?: Timestamp | null) {
  if (!value) {
    return "";
  }

  return value.toDate().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveProfileName(profile: UserProfileChatDocument | null, fallbackName: string) {
  return profile?.username?.trim() || profile?.name?.trim() || profile?.email?.split("@")[0] || fallbackName;
}

function resolveMessageAuthorName(message?: string) {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage) {
    return undefined;
  }

  const adoptionIntentMatch = trimmedMessage.match(/^(.+?) pretende adotar /i);
  const adoptionCancelMatch = trimmedMessage.match(/^(.+?) desistiu da adoção /i);

  return adoptionIntentMatch?.[1]?.trim() || adoptionCancelMatch?.[1]?.trim();
}

function resolveConversationFallbackName(conversation: ChatConversationDocument, otherUserId: string) {
  if (otherUserId === conversation.proprietarioId) {
    return (
      conversation.proprietarioUserName?.trim() ||
      conversation.ownerUserName?.trim() ||
      conversation.proprietarioName?.trim() ||
      conversation.ownerName?.trim() ||
      otherUserId
    );
  }

  return (
    conversation.interessadoUserName?.trim() ||
    conversation.interestedUserName?.trim() ||
    conversation.interessadoName?.trim() ||
    conversation.interestedName?.trim() ||
    resolveMessageAuthorName(conversation.lastMessage) ||
    otherUserId
  );
}

function resolveProfileAvatar(profile: UserProfileChatDocument | null) {
  if (!profile?.profilePhoto?.base64) {
    return undefined;
  }

  return decodeBase64Image(profile.profilePhoto.base64, profile.profilePhoto.mimeType ?? "image/jpeg");
}

function normalizeConversation(id: string, data: ChatConversationDocument) {
  const proprietarioId = data.proprietarioId?.trim();
  const interessadoUserId = data.interessadoUserId?.trim() || data.interessasdoUserId?.trim();
  const animalId = data.animalId?.trim();

  if (!proprietarioId || !interessadoUserId || !animalId) {
    return null;
  }

  return {
    id,
    animalId,
    proprietarioId,
    interessadoUserId,
    lastMessage: data.lastMessage?.trim() || "Nova conversa",
    lastMessageAt: data.lastMessageAt ?? null,
    lastMessageSenderId: data.lastMessageSenderId?.trim() || "",
    ownerLastReadAt: data.ownerLastReadAt ?? null,
    interestedLastReadAt: data.interestedLastReadAt ?? null,
    visibleToInterested: data.visibleToInterested ?? true,
    isProcessActive: data.adoptionRequestActive !== false,
  };
}

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversaChat[]>([]);
  const [activeTab, setActiveTab] = useState<ChatTab>("owner");
  const [isFinalizeMode, setIsFinalizeMode] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        if (activeTab === "finished") {
          return conversation.isProcessActive === false;
        }

        if (conversation.isProcessActive === false) {
          return false;
        }

        if (activeTab === "owner") {
          return conversation.proprietarioId === user?.uid;
        }

        return conversation.interessadoUserId === user?.uid;
      }),
    [activeTab, conversations, user?.uid],
  );

  const handleOpenDrawer = useCallback(() => {
    (navigation as unknown as DrawerNavigation).openDrawer();
  }, [navigation]);

  const handleSearch = useCallback(() => {
    console.log("Abrir busca de conversas");
  }, []);

  const handleChangeTab = useCallback((tab: ChatTab) => {
    setActiveTab(tab);
    setSelectedConversationId(null);
  }, []);

  const handleOpenConversation = useCallback(
    (conversation: ConversaChat) => {
      if (isFinalizeMode) {
        if (conversation.isProcessActive === false) {
          return;
        }

        setSelectedConversationId(conversation.id);
        return;
      }

      router.push({
        pathname: "/chat/[conversaId]",
        params: { conversaId: conversation.id },
      });
    },
    [isFinalizeMode],
  );

  const handleFinalizeProcess = useCallback(() => {
    if (isFinalizeMode) {
      setIsFinalizeMode(false);
      setSelectedConversationId(null);
      return;
    }

    setActiveTab((currentTab) => (currentTab === "finished" ? "owner" : currentTab));
    setIsFinalizeMode(true);
    setSelectedConversationId(null);
  }, [isFinalizeMode]);

  const finalizeSelectedConversation = useCallback(
    async (selectedConversation: ConversaChat) => {
      if (!user?.uid || isFinalizing) {
        return;
      }

      const finalMessage = `Processo de adoção de ${selectedConversation.petName} finalizado.`;

      try {
        setIsFinalizing(true);

        await addDoc(collection(db, "conversa", selectedConversation.id, "mensagens"), {
          senderId: user.uid,
          text: finalMessage,
          createdAt: serverTimestamp(),
        });

        await updateDoc(doc(db, "conversa", selectedConversation.id), {
          adoptionRequestActive: false,
          finalizedAt: serverTimestamp(),
          finalizedBy: user.uid,
          lastMessage: finalMessage,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: user.uid,
          visibleToInterested: true,
        });

        await notifyAdoptionFinished({
          recipientUserId: selectedConversation.otherUserId,
          senderUserId: user.uid,
          senderName: "Meau",
          conversationId: selectedConversation.id,
          petName: selectedConversation.petName,
        });

        setConversations((currentConversations) =>
          currentConversations.map((conversation) =>
            conversation.id === selectedConversation.id
              ? {
                  ...conversation,
                  isProcessActive: false,
                  lastMessage: finalMessage,
                  lastMessageTime: new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  lastMessageSenderId: user.uid,
                  hasUnread: false,
                }
              : conversation,
          ),
        );
        setActiveTab("finished");
        setIsFinalizeMode(false);
        setSelectedConversationId(null);
      } catch (error) {
        console.error("Erro ao finalizar processo:", error);
        Alert.alert("Erro", "Não foi possível finalizar o processo agora.");
      } finally {
        setIsFinalizing(false);
      }
    },
    [isFinalizing, user?.uid],
  );

  const handleConfirmFinalize = useCallback(() => {
    if (!selectedConversationId || isFinalizing) {
      return;
    }

    const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

    if (!selectedConversation) {
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Finalizar o processo de adoção de ${selectedConversation.petName}?`);

      if (confirmed) {
        void finalizeSelectedConversation(selectedConversation);
      }

      return;
    }

    Alert.alert("Finalizar processo", `Finalizar o processo de adoção de ${selectedConversation.petName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Finalizar",
        style: "destructive",
        onPress: () => {
          void finalizeSelectedConversation(selectedConversation);
        },
      },
    ]);
  }, [conversations, finalizeSelectedConversation, isFinalizing, selectedConversationId]);

  const loadConversations = useCallback(
    async (isActive: () => boolean) => {
      if (!user?.uid) {
        if (isActive()) {
          setConversations([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);

        const ownerQuery = query(collection(db, "conversa"), where("proprietarioId", "==", user.uid));
        const interestedQuery = query(collection(db, "conversa"), where("interessadoUserId", "==", user.uid));

        const [ownerSnapshot, interestedSnapshot] = await Promise.all([getDocs(ownerQuery), getDocs(interestedQuery)]);

        const conversationMap = new Map<string, ReturnType<typeof normalizeConversation>>();

        [...ownerSnapshot.docs, ...interestedSnapshot.docs].forEach((snapshot) => {
          const normalized = normalizeConversation(snapshot.id, snapshot.data() as ChatConversationDocument);

          if (normalized) {
            conversationMap.set(snapshot.id, normalized);
          }
        });

        const normalizedConversations = [...conversationMap.values()]
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .filter((conversation) => conversation.proprietarioId === user.uid || conversation.visibleToInterested)
          .sort((left, right) => {
            const leftTime = left.lastMessageAt?.toMillis() ?? 0;
            const rightTime = right.lastMessageAt?.toMillis() ?? 0;
            return rightTime - leftTime;
          });

        const animalIds = [...new Set(normalizedConversations.map((conversation) => conversation.animalId))];
        const otherUserIds = [
          ...new Set(
            normalizedConversations.map((conversation) =>
              conversation.proprietarioId === user.uid ? conversation.interessadoUserId : conversation.proprietarioId,
            ),
          ),
        ];

        const [animalEntries, userEntries] = await Promise.all([
          Promise.all(
            animalIds.map(async (animalId) => {
              const snapshot = await getDoc(doc(db, "animals", animalId));
              return [animalId, snapshot.exists() ? (snapshot.data() as AnimalDocument) : null] as const;
            }),
          ),
          Promise.all(
            otherUserIds.map(async (userId) => {
              try {
                const snapshot = await getDoc(doc(db, "users", userId));
                return [userId, snapshot.exists() ? (snapshot.data() as UserProfileChatDocument) : null] as const;
              } catch {
                return [userId, null] as const;
              }
            }),
          ),
        ]);

        const animalsById = new Map(animalEntries);
        const usersById = new Map(userEntries);
        const nextConversations = normalizedConversations.map((conversation) => {
          const otherUserId =
            conversation.proprietarioId === user.uid ? conversation.interessadoUserId : conversation.proprietarioId;
          const pet = animalsById.get(conversation.animalId);
          const otherUserProfile = usersById.get(otherUserId) ?? null;
          const fallbackName = resolveConversationFallbackName(conversation, otherUserId);
          const lastReadAt =
            conversation.proprietarioId === user.uid ? conversation.ownerLastReadAt : conversation.interestedLastReadAt;
          const hasUnread =
            conversation.lastMessageSenderId !== user.uid &&
            (conversation.lastMessageAt?.toMillis() ?? 0) > (lastReadAt?.toMillis() ?? 0);

          return {
            id: conversation.id,
            animalId: conversation.animalId,
            proprietarioId: conversation.proprietarioId,
            interessadoUserId: conversation.interessadoUserId,
            otherUserId,
            otherUserName: resolveProfileName(otherUserProfile, fallbackName),
            petName: pet?.nome?.trim() || "Animal",
            lastMessage: conversation.lastMessage,
            lastMessageTime: formatLastMessageTime(conversation.lastMessageAt),
            avatarUrl: resolveProfileAvatar(otherUserProfile),
            hasUnread,
            isProcessActive: conversation.isProcessActive,
          } satisfies ConversaChat;
        });

        if (isActive()) {
          setConversations(nextConversations);
        }
      } catch (error) {
        console.error("Erro ao carregar conversas:", error);
        if (isActive()) {
          setConversations([]);
        }
      } finally {
        if (isActive()) {
          setIsLoading(false);
        }
      }
    },
    [user?.uid],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void loadConversations(() => isActive);

      return () => {
        isActive = false;
      };
    }, [loadConversations]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#589B9B" />

      <View style={styles.screen}>
        <View style={styles.topBar} />

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            hitSlop={8}
            onPress={handleOpenDrawer}
            style={styles.iconButton}
          >
            <MaterialIcons name="menu" size={24} color="#434343" />
          </Pressable>

          <Text style={styles.headerTitle}>Chat</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar conversa"
            hitSlop={8}
            onPress={handleSearch}
            style={styles.iconButton}
          >
            <MaterialIcons name="search" size={24} color="#434343" />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {CHAT_TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel={`Ver conversas: ${tab.label}`}
                onPress={() => handleChangeTab(tab.key)}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {isFinalizeMode ? (
          <View style={styles.selectionNotice}>
            <Text style={styles.selectionNoticeText}>Selecione uma conversa ativa para finalizar o processo.</Text>
          </View>
        ) : null}

        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversaChatListItem
              conversation={item}
              onPress={handleOpenConversation}
              isSelectionMode={isFinalizeMode && item.isProcessActive !== false}
              isSelected={selectedConversationId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.feedbackContainer}>
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#434343" />
                  <Text style={styles.feedbackText}>Carregando conversas...</Text>
                </>
              ) : (
                <Text style={styles.feedbackText}>
                  {activeTab === "finished" ? "Nenhum processo finalizado." : "Nenhuma conversa encontrada."}
                </Text>
              )}
            </View>
          }
        />

        <View style={styles.footer}>
          {isFinalizeMode ? (
            <View style={styles.footerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar finalização"
                onPress={handleFinalizeProcess}
                style={({ pressed }) => [styles.footerSecondaryButton, pressed && styles.footerButtonPressed]}
              >
                <Text style={styles.footerButtonText}>CANCELAR</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirmar finalização do processo"
                disabled={!selectedConversationId || isFinalizing}
                onPress={handleConfirmFinalize}
                style={({ pressed }) => [
                  styles.footerButton,
                  (!selectedConversationId || isFinalizing) && styles.footerButtonDisabled,
                  pressed && styles.footerButtonPressed,
                ]}
              >
                <Text style={styles.footerButtonText}>{isFinalizing ? "FINALIZANDO..." : "FINALIZAR"}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Finalizar um processo"
              onPress={handleFinalizeProcess}
              style={({ pressed }) => [styles.footerButtonWide, pressed && styles.footerButtonPressed]}
            >
              <Text style={styles.footerButtonText}>FINALIZAR UM PROCESSO</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#589B9B",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  topBar: {
    height: TOP_BAR_HEIGHT,
    backgroundColor: "#589B9B",
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: "#88C9BF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Roboto_500Medium",
    flex: 1,
    marginLeft: 16,
    fontSize: 20,
    color: "#434343",
    fontWeight: "500",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 0.8,
    borderBottomColor: "#E6E7E8",
  },
  tabButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    paddingHorizontal: 4,
  },
  tabButtonActive: {
    borderBottomColor: "#589B9B",
  },
  tabText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
  tabTextActive: {
    color: "#434343",
    fontWeight: "500",
  },
  selectionNotice: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFF8D9",
    borderBottomWidth: 0.8,
    borderBottomColor: "#E6E7E8",
  },
  selectionNoticeText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 13,
    color: "#434343",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 120,
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
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
  },
  footerButtonWide: {
    width: 232,
    height: 40,
    backgroundColor: "#88C9BF",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  footerButton: {
    width: 136,
    height: 40,
    backgroundColor: "#88C9BF",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  footerSecondaryButton: {
    width: 108,
    height: 40,
    backgroundColor: "#E6E7E8",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  footerButtonPressed: {
    opacity: 0.9,
  },
  footerButtonText: {
    fontSize: 12,
    color: "#434343",
    fontWeight: "400",
  },
});
