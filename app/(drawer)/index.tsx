import { Courgette_400Regular } from "@expo-google-fonts/courgette";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { useFonts } from "expo-font";
import { SplashScreen, useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../components/appButton";
import { Brand } from "../../components/brand";
import { DrawerButton } from "../../components/drawerButton";
import { colors } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import * as Notifications from "expo-notifications";
import * as Constants from "expo-constants";

type DrawerNavigation = {
  openDrawer: () => void;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got mail! 📬",
      body: "Here is the notification body",
      data: { data: "goes here", test: { test1: "more data" } },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

async function registerForPushNotificationsAsync() {
  let token;

  await Notifications.setNotificationChannelAsync("myNotificationChannel", {
    name: "A channel is needed for the permissions prompt to appear",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }
  // Learn more about projectId:
  // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
  // EAS projectId is used here.
  try {
    const projectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    if (!projectId) {
      throw new Error("Project ID not found");
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log(token);
  } catch (e) {
    token = `${e}`;
  }

  return token;
}

export default function Index() {
  // Carrega o router para a navegação entre telas

  const router = useRouter();
  const navigation = useNavigation();
  const { profile, user } = useAuth();

  // Carrega as fontes utilizadas na página

  const [loaded, error] = useFonts({ Courgette_400Regular, Roboto_400Regular });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const [expoPushToken, setExpoPushToken] = useState("");
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => token && setExpoPushToken(token));

    Notifications.getNotificationChannelsAsync().then((value) => setChannels(value ?? []));

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Implementação da tela

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ margin: 12 }}>
              <DrawerButton
                color={colors.secondary}
                onPress={() => (navigation as unknown as DrawerNavigation).openDrawer()}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
      <View style={styles.body}>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <ScrollView contentContainerStyle={{ alignItems: "center" }}>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.text0}>Olá, {profile?.username ?? user?.email?.split("@")[0] ?? "usuário"}!</Text>
            </View>
            <View style={{ marginTop: 52 }}>
              <Text style={styles.text1}>
                Bem vindo ao Meau!{`\n`}
                Aqui você pode adotar, doar e ajudar{`\n`}
                cães e gatos com facilidade.{`\n`}
                Qual o seu interesse?
              </Text>
            </View>
            <View style={{ marginTop: 48, gap: 12 }}>
              <AppButton
                text="ADOTAR"
                backgroundColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => {
                  router.push("/(drawer)/adotar");
                }}
              />
              <AppButton
                text="CADASTRAR ANIMAL"
                backgroundColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => {
                  router.push("/register-animal");
                }}
              />
              <AppButton
                text="TEST NOTIFICATIONS"
                backgroundColor={"#bdbdbd"}
                textColor={"#757575"}
                onPress={() => {schedulePushNotification()}}
              />
            </View>
            <View style={{ marginTop: 68, marginBottom: 32 }}>
              <Brand />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {},
  body: {
    flex: 1,
  },
  text0: {
    textAlign: "center",
    fontFamily: "Courgette_400Regular",
    fontSize: 44,
    color: colors.primary,
    paddingHorizontal: 20,
  },
  text1: {
    textAlign: "center",
    fontFamily: "Roboto_400Regular",
    fontSize: 16,
    color: colors.onSurface,
  },
});
