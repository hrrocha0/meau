import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import app, { db } from "../firebaseConfig";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const DEFAULT_ANDROID_CHANNEL_ID = "default";
const WEB_NOTIFICATION_ICON = "/assets/icon.png";
const ADOPTION_REQUEST_CATEGORY_ID = "adoption_request_actions";
const ACCEPT_ADOPTION_ACTION_ID = "accept_adoption";
const START_ADOPTION_CHAT_ACTION_ID = "start_adoption_chat";
const REJECT_ADOPTION_ACTION_ID = "reject_adoption";
const handledActionResponseIds = new Set<string>();

type NotificationRoute = {
  screen?: "chat";
  conversaId?: string;
};

type NotificationData = NotificationRoute & {
  type: "chat_message" | "adoption_request" | "adoption_canceled" | "adoption_finished";
  conversationId?: string;
  senderId?: string;
  ownerId?: string;
  petId?: string;
  petName?: string;
};

type ExpoPushMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: NotificationData;
  categoryId?: string;
};

type PushTokenProvider = "expo" | "fcm-web";

type PushTokenDocument = {
  token?: string;
  platform?: string;
  provider?: PushTokenProvider;
};

type ExpoPushTicket = {
  status?: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushResponse = {
  data?: ExpoPushTicket | ExpoPushTicket[];
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
};

type NotificationPayload = Omit<ExpoPushMessage, "to" | "sound">;

type AdoptionNotificationAction =
  | typeof ACCEPT_ADOPTION_ACTION_ID
  | typeof START_ADOPTION_CHAT_ACTION_ID
  | typeof REJECT_ADOPTION_ACTION_ID;

type NotifyChatMessageParams = {
  recipientUserId: string;
  senderUserId: string;
  senderName: string;
  conversationId: string;
  message: string;
};

type NotifyAdoptionParams = {
  recipientUserId: string;
  senderUserId: string;
  senderName: string;
  conversationId: string;
  petId: string;
  petName: string;
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function getProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function getWebVapidKey() {
  return process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;
}

function buildTokenDocumentId(token: string) {
  return encodeURIComponent(token);
}

function isNativeFirebaseMissingError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Default FirebaseApp is not initialized")
  );
}

function normalizePreviewText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 117)}...`;
}

function isNotificationData(value: unknown): value is NotificationData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<NotificationData>;
  return typeof data.type === "string";
}

function openNotificationRoute(data: NotificationData) {
  const conversaId = data.conversaId ?? data.conversationId;

  if (data.screen === "chat" && conversaId) {
    router.push({
      pathname: "/chat/[conversaId]",
      params: { conversaId },
    });
  }
}

function isAdoptionNotificationAction(actionIdentifier: string): actionIdentifier is AdoptionNotificationAction {
  return (
    actionIdentifier === ACCEPT_ADOPTION_ACTION_ID ||
    actionIdentifier === START_ADOPTION_CHAT_ACTION_ID ||
    actionIdentifier === REJECT_ADOPTION_ACTION_ID
  );
}

function getAdoptionActionMessage(actionIdentifier: AdoptionNotificationAction, petName: string) {
  if (actionIdentifier === ACCEPT_ADOPTION_ACTION_ID) {
    return `Parabéns! O ${petName} terá um lar novo!`;
  }

  if (actionIdentifier === START_ADOPTION_CHAT_ACTION_ID) {
    return `Vamos conversar mais sobre um novo lar para o ${petName}.`;
  }

  return `Desculpas, mas o ${petName} já encontrou um lar novo.`;
}

async function registerAdoptionNotificationCategory() {
  if (Platform.OS === "web") {
    return;
  }

  await Notifications.setNotificationCategoryAsync(ADOPTION_REQUEST_CATEGORY_ID, [
    {
      identifier: ACCEPT_ADOPTION_ACTION_ID,
      buttonTitle: "Aceitar adoção",
      options: { opensAppToForeground: true },
    },
    {
      identifier: START_ADOPTION_CHAT_ACTION_ID,
      buttonTitle: "Iniciar conversa",
      options: { opensAppToForeground: true },
    },
    {
      identifier: REJECT_ADOPTION_ACTION_ID,
      buttonTitle: "Recusar adoção",
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]);
}

async function handleAdoptionNotificationAction(
  actionIdentifier: AdoptionNotificationAction,
  data: NotificationData,
) {
  const conversationId = data.conversaId ?? data.conversationId;
  const ownerId = data.ownerId;
  const petName = data.petName;

  if (!conversationId || !ownerId || !petName) {
    console.warn("Notificação de adoção sem dados suficientes para responder.", data);
    return;
  }

  const message = getAdoptionActionMessage(actionIdentifier, petName);
  const shouldFinishRequest = actionIdentifier !== START_ADOPTION_CHAT_ACTION_ID;
  const conversationRef = doc(db, "conversa", conversationId);
  const messageRef = doc(collection(db, "conversa", conversationId, "mensagens"));

  await runTransaction(db, async (transaction) => {
    const conversationSnapshot = await transaction.get(conversationRef);
    const conversation = conversationSnapshot.data() as {
      adoptionResponseAction?: string | null;
    } | undefined;

    if (conversation?.adoptionResponseAction) {
      return;
    }

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
      adoptionResponseAction: actionIdentifier,
      adoptionResponseAt: serverTimestamp(),
      adoptionResponseBy: ownerId,
      ...(shouldFinishRequest
        ? {
            adoptionRequestActive: false,
            finalizedAt: serverTimestamp(),
            finalizedBy: ownerId,
          }
        : { adoptionRequestActive: true }),
    });
  });
}

async function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;

  if (!isNotificationData(data)) {
    return;
  }

  if (isAdoptionNotificationAction(response.actionIdentifier)) {
    const responseId = `${response.notification.request.identifier}:${response.actionIdentifier}`;

    if (handledActionResponseIds.has(responseId)) {
      openNotificationRoute(data);
      return;
    }

    handledActionResponseIds.add(responseId);

    try {
      await handleAdoptionNotificationAction(response.actionIdentifier, data);
    } catch (error) {
      console.error("Erro ao processar ação da notificação de adoção:", error);
    }
  }

  openNotificationRoute(data);

  try {
    await Notifications.clearLastNotificationResponseAsync();
  } catch {
    // Alguns ambientes nativos antigos podem não expor essa limpeza.
  }
}

export function configureNotificationResponseHandling() {
  if (Platform.OS === "web") {
    return configureWebForegroundNotificationHandling();
  }

  void registerAdoptionNotificationCategory().catch((error) => {
    console.error("Erro ao registrar ações de notificação:", error);
  });

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    void handleNotificationResponse(response);
  });

  void Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        void handleNotificationResponse(response);
      }
    })
    .catch((error) => {
      console.error("Erro ao processar notificação inicial:", error);
    });

  return () => {
    subscription.remove();
  };
}

export async function registerPushTokenForUser(userId: string) {
  if (Platform.OS === "web") {
    return registerWebPushTokenForUser(userId);
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(DEFAULT_ANDROID_CHANNEL_ID, {
        name: "Notificações",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#88C9BF",
      });
    }

    const currentPermissions = await Notifications.getPermissionsAsync();
    const finalPermissions = currentPermissions.granted
      ? currentPermissions
      : await Notifications.requestPermissionsAsync();

    if (!finalPermissions.granted) {
      return null;
    }

    const projectId = getProjectId();

    if (!projectId) {
      console.warn("Project ID do EAS não encontrado para registrar Expo Push Token.");
      return null;
    }

    const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const tokenRef = doc(
      db,
      "users",
      userId,
      "pushTokens",
      buildTokenDocumentId(expoPushToken),
    );

    await setDoc(tokenRef, {
      token: expoPushToken,
      platform: Platform.OS,
      provider: "expo",
      projectId,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return expoPushToken;
  } catch (error) {
    if (Platform.OS === "android" && isNativeFirebaseMissingError(error)) {
      console.warn(
        "Push Android não registrado: adicione google-services.json, configure android.googleServicesFile e gere uma nova build.",
      );
      return null;
    }

    throw error;
  }
}

async function registerWebPushTokenForUser(userId: string) {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  const vapidKey = getWebVapidKey();

  if (!vapidKey) {
    console.warn("EXPO_PUBLIC_FIREBASE_VAPID_KEY não configurada; push web não será registrado.");
    return null;
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission !== "granted") {
    return null;
  }

  const [{ getMessaging, getToken }] = await Promise.all([
    import("firebase/messaging"),
    navigator.serviceWorker.register("/firebase-messaging-sw.js"),
  ]);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  });

  if (!token) {
    return null;
  }

  await setDoc(doc(db, "users", userId, "pushTokens", buildTokenDocumentId(token)), {
    token,
    platform: "web",
    provider: "fcm-web",
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return token;
}

export async function unregisterPushTokenForUser(userId: string, expoPushToken: string | null) {
  if (!expoPushToken) {
    return;
  }

  await deleteDoc(doc(
    db,
    "users",
    userId,
    "pushTokens",
    buildTokenDocumentId(expoPushToken),
  ));
}

async function loadUserPushTokens(userId: string) {
  const snapshot = await getDocs(collection(db, "users", userId, "pushTokens"));

  return snapshot.docs
    .map((tokenSnapshot) => tokenSnapshot.data() as PushTokenDocument)
    .filter((tokenDocument) => {
      const provider = tokenDocument.provider ?? "expo";
      return provider === "expo";
    })
    .map((tokenDocument) => tokenDocument.token)
    .filter((token): token is string => typeof token === "string" && token.length > 0);
}

function configureWebForegroundNotificationHandling() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return () => {};
  }

  let unsubscribe: (() => void) | null = null;
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const message = event.data as {
      type?: string;
      action?: string;
      data?: NotificationData;
    };

    if (
      message?.type !== "notification_action" ||
      typeof message.action !== "string" ||
      !isAdoptionNotificationAction(message.action) ||
      !isNotificationData(message.data)
    ) {
      return;
    }

    const { action, data } = message;

    void handleAdoptionNotificationAction(action, data)
      .then(() => {
        openNotificationRoute(data);
      })
      .catch((error) => {
        console.error("Erro ao processar ação da notificação web:", error);
      });
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
  }

  void import("firebase/messaging")
    .then(({ getMessaging, onMessage }) => {
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "Meau";
        const body = payload.notification?.body;
        const data = payload.data as Partial<NotificationData> | undefined;

        if (Notification.permission === "granted") {
          const options: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
            body,
            icon: WEB_NOTIFICATION_ICON,
          };

          if (data?.type === "adoption_request") {
            options.actions = [
              { action: ACCEPT_ADOPTION_ACTION_ID, title: "Aceitar adoção" },
              { action: START_ADOPTION_CHAT_ACTION_ID, title: "Iniciar conversa" },
              { action: REJECT_ADOPTION_ACTION_ID, title: "Recusar adoção" },
            ];
          }

          const notification = new Notification(title, {
            ...options,
            data,
          });

          notification.onclick = () => {
            window.focus();

            if (isNotificationData(data)) {
              openNotificationRoute(data);
            }

            notification.close();
          };
        }
      });
    })
    .catch((error) => {
      console.warn("Notificações web em foreground indisponíveis:", error);
    });

  return () => {
    unsubscribe?.();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    }
  };
}

async function sendExpoPushMessages(messages: ExpoPushMessage[]) {
  if (messages.length === 0) {
    return;
  }

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const payload = await response.json() as ExpoPushResponse;

  if (!response.ok || payload.errors?.length) {
    console.error("Erro ao enviar push pelo Expo Push Service:", payload.errors ?? payload);
    return;
  }

  const tickets = Array.isArray(payload.data)
    ? payload.data
    : payload.data
      ? [payload.data]
      : [];

  tickets
    .filter((ticket) => ticket.status === "error")
    .forEach((ticket) => {
      console.error("Ticket de push recusado pelo Expo:", ticket);
    });
}

async function notifyUser(
  recipientUserId: string,
  notification: NotificationPayload,
) {
  try {
    if (Platform.OS === "web") {
      const functions = getFunctions(app);
      const sendNotification = httpsCallable<
        { recipientUserId: string; notification: NotificationPayload },
        { ok: boolean }
      >(functions, "sendNotification");

      await sendNotification({ recipientUserId, notification });
      return;
    }

    const tokens = await loadUserPushTokens(recipientUserId);
    const messages = tokens.map((token) => ({
      ...notification,
      to: token,
      sound: "default" as const,
    }));

    await sendExpoPushMessages(messages);
  } catch (error) {
    console.error("Erro ao notificar usuário:", error);
  }
}

export async function notifyChatMessage({
  recipientUserId,
  senderUserId,
  senderName,
  conversationId,
  message,
}: NotifyChatMessageParams) {
  if (recipientUserId === senderUserId) {
    return;
  }

  await notifyUser(recipientUserId, {
    title: senderName,
    body: normalizePreviewText(message),
    data: {
      type: "chat_message",
      screen: "chat",
      conversaId: conversationId,
      conversationId,
      senderId: senderUserId,
    },
  });
}

export async function notifyAdoptionRequest({
  recipientUserId,
  senderUserId,
  senderName,
  conversationId,
  petId,
  petName,
}: NotifyAdoptionParams) {
  if (recipientUserId === senderUserId) {
    return;
  }

  await notifyUser(recipientUserId, {
    title: "Nova intenção de adoção",
    body: `${senderName} pretende adotar ${petName}.`,
    categoryId: ADOPTION_REQUEST_CATEGORY_ID,
    data: {
      type: "adoption_request",
      screen: "chat",
      conversaId: conversationId,
      conversationId,
      senderId: senderUserId,
      ownerId: recipientUserId,
      petId,
      petName,
    },
  });
}

export async function notifyAdoptionCanceled({
  recipientUserId,
  senderUserId,
  senderName,
  conversationId,
  petId,
  petName,
}: NotifyAdoptionParams) {
  if (recipientUserId === senderUserId) {
    return;
  }

  await notifyUser(recipientUserId, {
    title: "Adoção cancelada",
    body: `${senderName} desistiu da adoção de ${petName}.`,
    data: {
      type: "adoption_canceled",
      screen: "chat",
      conversaId: conversationId,
      conversationId,
      senderId: senderUserId,
      petId,
    },
  });
}

export async function notifyAdoptionFinished({
  recipientUserId,
  senderUserId,
  senderName,
  conversationId,
  petName,
}: Omit<NotifyAdoptionParams, "petId">) {
  if (recipientUserId === senderUserId) {
    return;
  }

  await notifyUser(recipientUserId, {
    title: "Processo de adoção finalizado",
    body: `${senderName} finalizou o processo de adoção de ${petName}.`,
    data: {
      type: "adoption_finished",
      screen: "chat",
      conversaId: conversationId,
      conversationId,
      senderId: senderUserId,
    },
  });
}
