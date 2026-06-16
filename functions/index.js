const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const https = require("https");

initializeApp();
const db = getFirestore();

exports.notificarNovaMensagem = onDocumentCreated(
    "conversa/{conversaId}/mensagens/{msgId}",
    async (event) => {
      const mensagem = event.data?.data();
      if (!mensagem) return;

      const {senderId, text} = mensagem;
      const conversaId = event.params.conversaId;


      const conversaRef = db.collection("conversa").doc(conversaId);
      const conversaSnap = await conversaRef.get();
      if (!conversaSnap.exists) return;

      const conversa = conversaSnap.data();
      const proprietarioId = conversa.proprietarioId?.trim();
      const interessadoId =
      conversa.interessadoUserId?.trim() ||
      conversa.interessasdoUserId?.trim();

      if (!proprietarioId || !interessadoId || !senderId) return;

      const destinatarioId =
      senderId === proprietarioId ? interessadoId : proprietarioId;

      const [destinatarioSnap, remetenteSnap] = await Promise.all([
        db.collection("users").doc(destinatarioId).get(),
        db.collection("users").doc(senderId).get(),
      ]);

      if (!destinatarioSnap.exists) return;

      const expoPushToken = destinatarioSnap.data()?.expoPushToken;
      if (!expoPushToken) return;

      const remetenteNome =
      remetenteSnap.data()?.username?.trim() ||
      remetenteSnap.data()?.name?.trim() ||
      "Alguém";

      const animalId = conversa.animalId?.trim();
      let animalNome = "";
      if (animalId) {
        const animalSnap = await db.collection("animals").doc(animalId).get();
        animalNome = animalSnap.data()?.nome?.trim() || "";
      }

      const titulo = animalNome ?
      `💬 ${remetenteNome} — ${animalNome}` :
      `💬 ${remetenteNome}`;

      const payload = JSON.stringify({
        to: expoPushToken,
        title: titulo,
        body: text?.trim() ?? "Nova mensagem",
        data: {conversaId},
        sound: "default",
      });

      await new Promise((resolve, reject) => {
        const req = https.request(
            {
              hostname: "exp.host",
              path: "/--/api/v2/push/send",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              },
            },
            (res) => {
              res.on("data", () => {});
              res.on("end", resolve);
            },
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
      });
    },
);
