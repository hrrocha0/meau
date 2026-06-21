importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB0kr53HPYz2lCUZH2gcB1h61-WG2xYwO4",
  authDomain: "meau-hrrocha.firebaseapp.com",
  projectId: "meau-hrrocha",
  storageBucket: "meau-hrrocha.firebasestorage.app",
  messagingSenderId: "7488868550",
  appId: "1:7488868550:web:73f7e0d05ceb3ad0c347c7",
});

const messaging = firebase.messaging();

function resolveNotificationUrl(data) {
  const conversaId = data?.conversaId || data?.conversationId;

  if (data?.screen === "chat" && conversaId) {
    return `/chat/${encodeURIComponent(conversaId)}`;
  }

  return "/";
}

function getNotificationActions(data) {
  if (data?.type !== "adoption_request") {
    return undefined;
  }

  return [
    { action: "accept_adoption", title: "Aceitar adoção" },
    { action: "start_adoption_chat", title: "Iniciar conversa" },
    { action: "reject_adoption", title: "Recusar adoção" },
  ];
}

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Meau";
  const options = {
    body: payload.notification?.body,
    icon: "/assets/icon.png",
    data: payload.data || {},
    actions: getNotificationActions(payload.data || {}),
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = resolveNotificationUrl(data);
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();

          if (action) {
            client.postMessage({
              type: "notification_action",
              action,
              data,
            });
          }

          if ("navigate" in client) {
            return client.navigate(url);
          }

          return undefined;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url).then((client) => {
          if (client && action) {
            client.postMessage({
              type: "notification_action",
              action,
              data,
            });
          }

          return client;
        });
      }

      return undefined;
    }),
  );
});
