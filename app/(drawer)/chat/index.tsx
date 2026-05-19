import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { ConversaChatListItem } from "../../../components/chat/ConversaChatListItem";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../firebaseConfig";
import { decodeBase64Image } from "../../../utils/petImages";
import {
  ChatConversationDocument,
  ConversaChat,
  UserProfileChatDocument,
} from "../../../types/chat";

const TOP_BAR_HEIGHT = 24;
const HEADER_HEIGHT = 56;

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

function resolveProfileName(profile: UserProfileChatDocument | null, fallbackId: string) {
  return (
    profile?.username?.trim()
    || profile?.name?.trim()
    || profile?.email?.split("@")[0]
    || fallbackId
  );
}

function resolveProfileAvatar(profile: UserProfileChatDocument | null) {
  if (!profile?.profilePhoto?.base64) {
    return undefined;
  }

  return decodeBase64Image(
    profile.profilePhoto.base64,
    profile.profilePhoto.mimeType ?? "image/jpeg",
  );
}

function normalizeConversation(
  id: string,
  data: ChatConversationDocument,
) {
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
  };
}

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversaChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleOpenDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleSearch = useCallback(() => {
    console.log("Abrir busca de conversas");
  }, []);

  const handleOpenConversation = useCallback(
    (conversation: ConversaChat) => {
      router.push({
        pathname: "/chat/[conversaId]",
        params: { conversaId: conversation.id },
      });
    },
    [],
  );

  const handleFinalizeProcess = useCallback(() => {
    console.log("Finalizar processo");
  }, []);

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

        const ownerQuery = query(
          collection(db, "conversa"),
          where("proprietarioId", "==", user.uid),
        );
        const interestedQuery = query(
          collection(db, "conversa"),
          where("interessadoUserId", "==", user.uid),
        );

        const [ownerSnapshot, interestedSnapshot] = await Promise.all([
          getDocs(ownerQuery),
          getDocs(interestedQuery),
        ]);

        const conversationMap = new Map<string, ReturnType<typeof normalizeConversation>>();

        [...ownerSnapshot.docs, ...interestedSnapshot.docs].forEach((snapshot) => {
          const normalized = normalizeConversation(
            snapshot.id,
            snapshot.data() as ChatConversationDocument,
          );

          if (normalized) {
            conversationMap.set(snapshot.id, normalized);
          }
        });

        const normalizedConversations = [...conversationMap.values()]
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .filter((conversation) => (
            conversation.proprietarioId === user.uid
            || conversation.visibleToInterested
          ))
          .sort((left, right) => {
            const leftTime = left.lastMessageAt?.toMillis() ?? 0;
            const rightTime = right.lastMessageAt?.toMillis() ?? 0;
            return rightTime - leftTime;
          });

        const animalIds = [...new Set(normalizedConversations.map((conversation) => conversation.animalId))];
        const otherUserIds = [
          ...new Set(
            normalizedConversations.map((conversation) => (
              conversation.proprietarioId === user.uid
                ? conversation.interessadoUserId
                : conversation.proprietarioId
            )),
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
          const otherUserId = conversation.proprietarioId === user.uid
            ? conversation.interessadoUserId
            : conversation.proprietarioId;
          const pet = animalsById.get(conversation.animalId);
          const otherUserProfile = usersById.get(otherUserId) ?? null;
          const lastReadAt = conversation.proprietarioId === user.uid
            ? conversation.ownerLastReadAt
            : conversation.interestedLastReadAt;
          const hasUnread = conversation.lastMessageSenderId !== user.uid
            && (conversation.lastMessageAt?.toMillis() ?? 0) > (lastReadAt?.toMillis() ?? 0);

          return {
            id: conversation.id,
            animalId: conversation.animalId,
            proprietarioId: conversation.proprietarioId,
            interessadoUserId: conversation.interessadoUserId,
            otherUserId,
            otherUserName: resolveProfileName(otherUserProfile, otherUserId),
            petName: pet?.nome?.trim() || "Animal",
            lastMessage: conversation.lastMessage,
            lastMessageTime: formatLastMessageTime(conversation.lastMessageAt),
            avatarUrl: resolveProfileAvatar(otherUserProfile),
            hasUnread,
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

        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversaChatListItem
              conversation={item}
              onPress={handleOpenConversation}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={(
            <View style={styles.feedbackContainer}>
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#434343" />
                  <Text style={styles.feedbackText}>Carregando conversas...</Text>
                </>
              ) : (
                <Text style={styles.feedbackText}>Nenhuma conversa encontrada.</Text>
              )}
            </View>
          )}
        />

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Finalizar um processo"
            onPress={handleFinalizeProcess}
            style={({ pressed }) => [
              styles.footerButton,
              pressed && styles.footerButtonPressed,
            ]}
          >
            <Text style={styles.footerButtonText}>FINALIZAR UM PROCESSO</Text>
          </Pressable>
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
  footerButton: {
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
  footerButtonPressed: {
    opacity: 0.9,
  },
  footerButtonText: {
    fontSize: 12,
    color: "#434343",
    fontWeight: "400",
  },
});
