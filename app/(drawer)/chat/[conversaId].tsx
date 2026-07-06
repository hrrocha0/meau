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
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
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

  if (!trimmedMessage) {
    return undefined;
  }

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
  if (!profile?.profilePhoto?.base64) {
    return undefined;
  }

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
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [interestedUserId, setInterestedUserId] = useState<string | null>(null);
  const [isVisibleToInterested, setIsVisibleToInterested] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadConversationMeta() {
      if (!conversaId || !user?.uid) {
        return;
      }

      try {
        const conversationSnapshot = await getDoc(doc(db, "conversa", conversaId));

        if (!conversationSnapshot.exists()) {
          return;
        }

        const conversation = conversationSnapshot.data() as ChatConversationDocument;
        const proprietarioId = conversation.proprietarioId?.trim();
        const interessadoUserId = conversation.interessadoUserId?.trim() || conversation.interessasdoUserId?.trim();
        const animalId = conversation.animalId?.trim();

        if (!proprietarioId || !interessadoUserId) {
          return;
        }

        const otherUserId = proprietarioId === user.uid ? interessadoUserId : proprietarioId;
        const fallbackName = resolveConversationFallbackName(
          conversation,
          otherUserId,
          proprietarioId,
        );
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

    return () => {
      isActive = false;
    };
  }, [conversaId, user?.uid]);

  useEffect(() => {
    if (!conversaId || !user?.uid || !ownerId) {
      return;
    }

    const readField = ownerId === user.uid
      ? "ownerLastReadAt"
      : "interestedLastReadAt";

    void updateDoc(doc(db, "conversa", conversaId), {
      [readField]: serverTimestamp(),
    }).catch((error) => {
      console.error("Erro ao marcar conversa como lida:", error);
    });
  }, [conversaId, ownerId, user?.uid]);

  const isCurrentUserOwner = ownerId === user?.uid;
  const canCurrentUserSend = isCurrentUserOwner || isVisibleToInterested;

  const currentUserAvatar = useMemo(() => {
    if (!profile?.profilePhoto?.base64) {
      return undefined;
    }

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

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!conversaId || !user?.uid || newMessages.length === 0) {
      return;
    }

    const nextMessage = newMessages[0];
    const text = nextMessage.text.trim();

    if (!text) {
      return;
    }

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
                onPress={() => {
                  router.push("/chat");
                }}
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

      <SafeAreaView edges={["bottom"]} style={styles.chatSafeArea}>
        <GiftedChat
          messages={messages}
          onSend={(newMessages) => {
            if (!canCurrentUserSend) {
              return;
            }

            void onSend(newMessages);
          }}
          user={giftedUser}
          isSendButtonAlwaysVisible
          isScrollToBottomEnabled
          textInputProps={{
            placeholder: "Digite sua mensagem...",
            editable: canCurrentUserSend,
          }}
          keyboardAvoidingViewProps={{
            keyboardVerticalOffset,
          }}
          renderInputToolbar={(props) => (
            canCurrentUserSend ? (
              <InputToolbar
                {...props}
                containerStyle={[styles.inputToolbar, props.containerStyle]}
              />
            ) : null
          )}
          renderSend={(props) => (
            <Send
              {...props}
              containerStyle={styles.sendContainer}
            >
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
  leftBubble: {
    backgroundColor: "#FFFFFF",
  },
  rightBubble: {
    backgroundColor: "#88c9bfe8",
  },
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
  messagesList: {
    backgroundColor: "#F1F2F2",
  },
  messagesContent: {
    backgroundColor: "#F1F2F2",
  },
});
