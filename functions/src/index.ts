import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

initializeApp();

type NotificationData = {
  type: "chat_message" | "adoption_request" | "adoption_canceled" | "adoption_finished";
  screen?: "chat";
  conversaId?: string;
  conversationId?: string;
  senderId?: string;
  ownerId?: string;
  petId?: string;
  petName?: string;
};

type NotificationPayload = {
  title: string;
  body: string;
  data: NotificationData;
  categoryId?: string;
};

type PushTokenDocument = {
  token?: string;
  provider?: "expo" | "fcm-web";
};

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

function assertNotificationPayload(value: unknown): asserts value is NotificationPayload {
  if (!value || typeof value !== "object") {
    throw new HttpsError("invalid-argument", "Notificacao invalida.");
  }

  const payload = value as Partial<NotificationPayload>;

  if (
    typeof payload.title !== "string" ||
    typeof payload.body !== "string" ||
    !payload.data ||
    typeof payload.data !== "object" ||
    typeof payload.data.type !== "string"
  ) {
    throw new HttpsError("invalid-argument", "Notificacao invalida.");
  }
}

function stringifyData(data: NotificationData) {
  return Object.fromEntries(
    Object.entries(data)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, value]) => [key, value]),
  );
}

async function sendExpoPush(tokens: string[], notification: NotificationPayload) {
  if (tokens.length === 0) {
    return;
  }

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tokens.map((token) => ({
      to: token,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data,
      categoryId: notification.categoryId,
    }))),
  });

  if (!response.ok) {
    logger.error("Expo Push Service recusou a notificacao.", {
      status: response.status,
      body: await response.text(),
    });
  }
}

async function sendFcmWebPush(tokens: string[], notification: NotificationPayload) {
  if (tokens.length === 0) {
    return;
  }

  const adoptionActions = notification.data.type === "adoption_request"
    ? [
        { action: "accept_adoption", title: "Aceitar adoção" },
        { action: "start_adoption_chat", title: "Iniciar conversa" },
        { action: "reject_adoption", title: "Recusar adoção" },
      ]
    : undefined;

  const result = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: stringifyData(notification.data),
    webpush: {
      notification: {
        icon: "/assets/icon.png",
        actions: adoptionActions,
      },
    },
  });

  if (result.failureCount > 0) {
    result.responses.forEach((response, index) => {
      if (!response.success) {
        logger.warn("Falha ao enviar FCM web push.", {
          token: tokens[index],
          error: response.error?.message,
        });
      }
    });
  }
}

export const sendNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuario nao autenticado.");
  }

  const { recipientUserId, notification } = request.data as {
    recipientUserId?: unknown;
    notification?: unknown;
  };

  if (typeof recipientUserId !== "string" || recipientUserId.length === 0) {
    throw new HttpsError("invalid-argument", "Destinatario invalido.");
  }

  assertNotificationPayload(notification);

  const tokensSnapshot = await getFirestore()
    .collection("users")
    .doc(recipientUserId)
    .collection("pushTokens")
    .get();

  const expoTokens: string[] = [];
  const fcmWebTokens: string[] = [];

  tokensSnapshot.docs.forEach((tokenSnapshot) => {
    const tokenDocument = tokenSnapshot.data() as PushTokenDocument;

    if (typeof tokenDocument.token !== "string" || tokenDocument.token.length === 0) {
      return;
    }

    if (tokenDocument.provider === "fcm-web") {
      fcmWebTokens.push(tokenDocument.token);
      return;
    }

    expoTokens.push(tokenDocument.token);
  });

  await Promise.all([
    sendExpoPush(expoTokens, notification),
    sendFcmWebPush(fcmWebTokens, notification),
  ]);

  return { ok: true };
});
