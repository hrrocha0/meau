import React, { useCallback, useEffect, useMemo, useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  Bubble,
  GiftedChat,
  IMessage,
  InputToolbar,
  Send,
} from "react-native-gifted-chat";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../firebaseConfig";
import { decodeBase64Image } from "../../../utils/petImages";
import {
  ChatConversationDocument,
  ChatMessageDocument,
  UserProfileChatDocument,
} from "../../../types/chat";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { notifyChatMessage } from "../../../services/notifications";

const HEADER_HEIGHT = 56;

type AnimalDocument = {
  nome?: string;
  animalId?: string;
};

type ChatUser = {
  _id: string;
  name: string;
  avatar?: string;
};

function resolveProfileName(profile: UserProfileChatDocument | null, fallbackName: string) {
  return (
    profile?.username?.trim()
    || profile?.name?.trim()
    || profile?.email?.split("@")[0]
    || fallbackName
  );
}

function resolveMessageAuthorName(message?: string) {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) return undefined;
  const adoptionIntentMatch = trimmedMessage.match(/^(.+?) pretende adotar /i);
  const adoptionCancelMatch = trimmedMessage.match(/^(.+?) desistiu da adoção /i);
  return adoptionIntentMatch?.[1]?.trim() || adoptionCancelMatch?.[1]?.trim();
}

function resolveConversationFallbackName(
  conversation: ChatConversationDocument,
  otherUserId: string,
  proprietarioId: string,
) {
  if (otherUserId === proprietarioId) {
    return (
      conversation.proprietarioUserName?.trim()
      || conversation.ownerUserName?.trim()
      || conversation.proprietarioName?.trim()
      || conversation.ownerName?.trim()
      || otherUserId
    );
  }
  return (
    conversation.interessadoUserName?.trim()
    || conversation.interestedUserName?.trim()
    || conversation.interessadoName?.trim()
    || conversation.interestedName?.trim()
    || resolveMessageAuthorName(conversation.lastMessage)
    || otherUserId
  );
}

function resolveProfileAvatar(profile: UserProfileChatDocument | null) {
  if (!profile?.profilePhoto?.base64) return undefined;
  return decodeBase64Image(
    profile.profilePhoto.base64,
    profile.profilePhoto.mimeType ?? "image/jpeg",
  );
}

export default function ChatConversationScreen() {
  const { conversaId } = useLocalSearchParams<{ conversaId?: string }>();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [petName, setPetName] = useState("Chat");
  const [petId, setPetId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [interestedUserId, setInterestedUserId] = useState<string | null>(null);
  const [isVisibleToInterested, setIsVisibleToInterested] = useState(true);
  const [adoptionRequestActive, setAdoptionRequestActive] = useState(false);
  const [adoptionResponseAction, setAdoptionResponseAction] = useState<string | null>(null);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [isProcessingAdoption, setIsProcessingAdoption] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadConversationMeta() {
      if (!conversaId || !user?.uid) return;

      try {
        const conversationSnapshot = await getDoc(doc(db, "conversa", conversaId));
        if (!conversationSnapshot.exists()) return;

        const conversation = conversationSnapshot.data() as ChatConversationDocument;
        const proprietarioId = conversation.proprietarioId?.trim();
        const interessadoUserId = conversation.interessadoUserId?.trim() || conversation.interessasdoUserId?.trim();
        const animalId = conversation.animalId?.trim();

        if (!proprietarioId || !interessadoUserId) return;

        const otherUserId = proprietarioId === user.uid ? interessadoUserId : proprietarioId;
        const fallbackName = resolveConversationFallbackName(conversation, otherUserId, proprietarioId);

        const [otherUserSnapshot, animalSnapshot] = await Promise.all([
          getDoc(doc(db, "users", otherUserId)).catch(() => null),
          animalId ? getDoc(doc(db, "animals", animalId)).catch(() => null) : null,
        ]);

        const otherUserProfile = otherUserSnapshot?.exists()
          ? (otherUserSnapshot.data() as UserProfileChatDocument)
          : null;
        const animalData = animalSnapshot?.exists()
          ? (animalSnapshot.data() as AnimalDocument)
          : null;

        if (isActive) {
          setOwnerId(proprietarioId);
          setInterestedUserId(interessadoUserId);
          setIsVisibleToInterested(conversation.visibleToInterested ?? true);
          setAdoptionRequestActive(conversation.adoptionRequestActive ?? false);
          setAdoptionResponseAction(conversation.adoptionResponseAction ?? null);
          setPetId(animalId ?? null);
          setOtherUser({
            _id: otherUserId,
            name: resolveProfileName(otherUserProfile, fallbackName),
            avatar: resolveProfileAvatar(otherUserProfile),
          });
          setPetName(animalData?.nome?.trim() || "Chat");
        }
      } catch (error) {
        console.error("Erro ao carregar dados da conversa:", error);
      }
    }

    void loadConversationMeta();
    return () => { isActive = false; };
  }, [conversaId, user?.uid]);

  // Listener em tempo real para atualizar estado da adoção
  useEffect(() => {
    if (!conversaId) return;

    const unsubscribe = onSnapshot(doc(db, "conversa", conversaId), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as ChatConversationDocument;
      setAdoptionRequestActive(data.adoptionRequestActive ?? false);
      setAdoptionResponseAction(data.adoptionResponseAction ?? null);
      setIsVisibleToInterested(data.visibleToInterested ?? true);
    });

    return unsubscribe;
  }, [conversaId]);

  useEffect(() => {
    if (!conversaId || !user?.uid || !ownerId) return;

    const readField = ownerId === user.uid ? "ownerLastReadAt" : "interestedLastReadAt";

    void updateDoc(doc(db, "conversa", conversaId), {
      [readField]: serverTimestamp(),
    }).catch((error) => {
      console.error("Erro ao marcar conversa como lida:", error);
    });
  }, [conversaId, ownerId, user?.uid]);

  const isCurrentUserOwner = ownerId === user?.uid;
  const canCurrentUserSend = isCurrentUserOwner || isVisibleToInterested;

  // Mostra o modal automaticamente para o dono quando há solicitação ativa
  useEffect(() => {
    if (isCurrentUserOwner && adoptionRequestActive && !adoptionResponseAction) {
      setShowAdoptionModal(true);
    } else {
      setShowAdoptionModal(false);
    }
  }, [isCurrentUserOwner, adoptionRequestActive, adoptionResponseAction]);

  const currentUserAvatar = useMemo(() => {
    if (!profile?.profilePhoto?.base64) return undefined;
    return decodeBase64Image(
      profile.profilePhoto.base64,
      profile.profilePhoto.mimeType ?? "image/jpeg",
    );
  }, [profile?.profilePhoto?.base64, profile?.profilePhoto?.mimeType]);

  useEffect(() => {
    if (!conversaId || !user?.uid) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, "conversa", conversaId, "mensagens"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs.map((messageSnapshot) => {
          const message = messageSnapshot.data() as ChatMessageDocument;
          const senderId = message.senderId?.trim() || "";
          const isCurrentUser = senderId === user.uid;

          return {
            _id: messageSnapshot.id,
            text: message.text?.trim() || "",
            createdAt: message.createdAt?.toDate() ?? new Date(),
            user: isCurrentUser
              ? {
                  _id: user.uid,
                  name: profile?.username ?? profile?.name ?? "Você",
                  avatar: currentUserAvatar,
                }
              : {
                  _id: otherUser?._id ?? senderId,
                  name: otherUser?.name ?? senderId,
                  avatar: otherUser?.avatar,
                },
          } satisfies IMessage;
        });

        setMessages(nextMessages);
      },
      (error) => {
        console.error("Erro ao carregar mensagens:", error);
      },
    );

    return unsubscribe;
  }, [conversaId, currentUserAvatar, otherUser, profile?.name, profile?.username, user?.uid]);

  async function handleAdoptionDecision(accepted: boolean) {
    if (!conversaId || !ownerId || !interestedUserId) return;

    setIsProcessingAdoption(true);

    try {
      const actionId = accepted ? "accept_adoption" : "reject_adoption";
      const message = accepted
        ? `Parabéns! O ${petName} terá um lar novo!`
        : `Desculpas, mas o ${petName} já encontrou um lar novo.`;

      const conversationRef = doc(db, "conversa", conversaId);
      const messageRef = doc(collection(db, "conversa", conversaId, "mensagens"));

      await runTransaction(db, async (transaction) => {
        const conversationSnapshot = await transaction.get(conversationRef);
        const conversation = conversationSnapshot.data() as { adoptionResponseAction?: string | null } | undefined;

        if (conversation?.adoptionResponseAction) return;

        transaction.set(messageRef, {
          senderId: ownerId,
          text: message,
          createdAt: serverTimestamp(),
        });

        transaction.update(conversationRef, {
          lastMessage: message,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: ownerId,
          ownerLastReadAt: serverTimestamp(),
          visibleToInterested: true,
          adoptionResponseAction: actionId,
          adoptionResponseAt: serverTimestamp(),
          adoptionResponseBy: ownerId,
          adoptionRequestActive: false,
          finalizedAt: serverTimestamp(),
          finalizedBy: ownerId,
        });

        // Se aceitou, transfere o animal
        if (accepted && petId) {
          const animalRef = doc(db, "animals", petId);
          transaction.update(animalRef, {
            usuarioId: interestedUserId,
            oculto: true,
            adotadoEm: serverTimestamp(),
            adotadoPor: interestedUserId,
          });
        }

        // Se recusou, marca que esse interessado não pode tentar de novo
        if (!accepted) {
          const rejectedRef = doc(
            db,
            "animals",
            petId ?? "unknown",
            "rejectedUsers",
            interestedUserId,
          );
          transaction.set(rejectedRef, {
            userId: interestedUserId,
            rejectedAt: serverTimestamp(),
          });
        }
      });

      setShowAdoptionModal(false);
    } catch (error) {
      console.error("Erro ao processar decisão de adoção:", error);
    } finally {
      setIsProcessingAdoption(false);
    }
  }

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!conversaId || !user?.uid || newMessages.length === 0) return;

    const nextMessage = newMessages[0];
    const text = nextMessage.text.trim();
    if (!text) return;

    try {
      await addDoc(collection(db, "conversa", conversaId, "mensagens"), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
      });

      const nextConversationState: {
        lastMessage: string;
        lastMessageAt: ReturnType<typeof serverTimestamp>;
        lastMessageSenderId: string;
        ownerLastReadAt?: ReturnType<typeof serverTimestamp>;
        interestedLastReadAt?: ReturnType<typeof serverTimestamp>;
        visibleToInterested?: boolean;
      } = {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
      };

      if (isCurrentUserOwner && !isVisibleToInterested) {
        nextConversationState.visibleToInterested = true;
        setIsVisibleToInterested(true);
      }

      if (isCurrentUserOwner) {
        nextConversationState.ownerLastReadAt = serverTimestamp();
      } else {
        nextConversationState.interestedLastReadAt = serverTimestamp();
      }

      await updateDoc(doc(db, "conversa", conversaId), nextConversationState);

      const recipientUserId = user.uid === ownerId ? interestedUserId : ownerId;

      if (recipientUserId) {
        await notifyChatMessage({
          recipientUserId,
          senderUserId: user.uid,
          senderName: profile?.username ?? profile?.name ?? "Meau",
          conversationId: conversaId,
          message: text,
        });
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  }, [
    conversaId,
    interestedUserId,
    isCurrentUserOwner,
    isVisibleToInterested,
    ownerId,
    profile?.name,
    profile?.username,
    user?.uid,
  ]);

  const giftedUser = useMemo(
    () => ({
      _id: user?.uid ?? "anonimo",
      name: profile?.username ?? profile?.name ?? "Você",
      avatar: currentUserAvatar,
    }),
    [currentUserAvatar, profile?.name, profile?.username, user?.uid],
  );

  const headerTitle = otherUser?.name ?? "Chat";
  const keyboardVerticalOffset = HEADER_HEIGHT + insets.bottom;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: styles.header,
          headerShadowVisible: false,
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar para conversas"
                hitSlop={8}
                style={styles.backButton}
                onPress={() => { router.push("/chat"); }}
              >
                <MaterialIcons name="arrow-back" size={24} color="#434343" />
              </Pressable>
            </View>
          ),
          headerTitleAlign: "left",
          headerTitle: () => (
            <Text numberOfLines={1} style={styles.headerTitle}>
              {headerTitle}
            </Text>
          ),
        }}
      />

      {/* Modal de decisão de adoção */}
      <Modal
        visible={showAdoptionModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Solicitação de adoção</Text>
            <Text style={styles.modalBody}>
              {otherUser?.name ?? "Alguém"} deseja adotar{" "}
              <Text style={styles.modalPetName}>{petName}</Text>.{"\n"}
              O que você deseja fazer?
            </Text>

            {isProcessingAdoption ? (
              <ActivityIndicator color="#88C9BF" style={{ marginTop: 16 }} />
            ) : (
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnAccept]}
                  onPress={() => handleAdoptionDecision(true)}
                >
                  <Text style={styles.modalBtnTextLight}>Aceitar adoção</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnChat]}
                  onPress={() => setShowAdoptionModal(false)}
                >
                  <Text style={styles.modalBtnTextDark}>Continuar conversa</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnReject]}
                  onPress={() => handleAdoptionDecision(false)}
                >
                  <Text style={styles.modalBtnTextLight}>Recusar adoção</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <SafeAreaView edges={["bottom"]} style={styles.chatSafeArea}>
        {/* Banner para o dono quando há solicitação pendente */}
        {isCurrentUserOwner && adoptionRequestActive && !adoptionResponseAction && (
          <Pressable
            style={styles.adoptionBanner}
            onPress={() => setShowAdoptionModal(true)}
          >
            <MaterialIcons name="pets" size={18} color="#fff" />
            <Text style={styles.adoptionBannerText}>
              Solicitação de adoção pendente — toque para responder
            </Text>
          </Pressable>
        )}

        {/* Banner informativo para o interessado */}
        {!isCurrentUserOwner && adoptionRequestActive && !adoptionResponseAction && (
          <View style={styles.waitingBanner}>
            <MaterialIcons name="hourglass-empty" size={18} color="#88C9BF" />
            <Text style={styles.waitingBannerText}>
              Aguardando resposta do dono
            </Text>
          </View>
        )}

        <GiftedChat
          messages={messages}
          onSend={(newMessages) => {
            if (!canCurrentUserSend) return;
            void onSend(newMessages);
          }}
          user={giftedUser}
          isSendButtonAlwaysVisible
          isScrollToBottomEnabled
          textInputProps={{
            placeholder: "Digite sua mensagem...",
            editable: canCurrentUserSend,
          }}
          keyboardAvoidingViewProps={{ keyboardVerticalOffset }}
          renderInputToolbar={(props) => (
            canCurrentUserSend ? (
              <InputToolbar
                {...props}
                containerStyle={[styles.inputToolbar, props.containerStyle]}
              />
            ) : null
          )}
          renderSend={(props) => (
            <Send {...props} containerStyle={styles.sendContainer}>
              <View style={styles.sendButton}>
                <MaterialIcons name="send" size={24} color="#FFFFFF" />
              </View>
            </Send>
          )}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                left: styles.leftBubble,
                right: styles.rightBubble,
              }}
              textStyle={{
                left: styles.leftBubbleText,
                right: styles.rightBubbleText,
              }}
            />
          )}
          listProps={{
            style: styles.messagesList,
            contentContainerStyle: styles.messagesContent,
          }}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  chatSafeArea: {
    flex: 1,
    backgroundColor: "#F1F2F2",
  },
  header: {
    backgroundColor: "#cfe9e5",
    height: 64,
  },
  headerLeftContainer: {
    marginLeft: 12,
    height: 44,
    justifyContent: "center",
  },
  headerTitle: {
    marginLeft: 8,
    color: "#434343",
    fontFamily: "Roboto_500Medium",
    fontSize: 20,
    lineHeight: 24,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  inputToolbar: {
    borderTopColor: "#E6E7E8",
    borderTopWidth: 1,
  },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#88C9BF",
    alignItems: "center",
    justifyContent: "center",
  },
  leftBubble: { backgroundColor: "#FFFFFF" },
  rightBubble: { backgroundColor: "#88c9bfe8" },
  leftBubbleText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: "#434343",
  },
  rightBubbleText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: "#FFFFFF",
  },
  messagesList: { backgroundColor: "#F1F2F2" },
  messagesContent: { backgroundColor: "#F1F2F2" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: "Roboto_500Medium",
    fontSize: 18,
    color: "#434343",
    marginBottom: 12,
    textAlign: "center",
  },
  modalBody: {
    fontFamily: "Roboto_400Regular",
    fontSize: 15,
    color: "#575757",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  modalPetName: {
    fontFamily: "Roboto_500Medium",
    color: "#88C9BF",
  },
  modalButtons: {
    marginTop: 20,
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnAccept: { backgroundColor: "#88C9BF" },
  modalBtnChat: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#88C9BF",
  },
  modalBtnReject: { backgroundColor: "#f15f5c" },
  modalBtnTextLight: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    color: "#fff",
  },
  modalBtnTextDark: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    color: "#88C9BF",
  },

  // Banners
  adoptionBanner: {
    backgroundColor: "#88C9BF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  adoptionBannerText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 13,
    color: "#fff",
    flex: 1,
  },
  waitingBanner: {
    backgroundColor: "#F0FAFA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E7E8",
  },
  waitingBannerText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 13,
    color: "#88C9BF",
    flex: 1,
  },
});