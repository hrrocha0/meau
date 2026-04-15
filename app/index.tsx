import { Courgette_400Regular } from "@expo-google-fonts/courgette";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "../components/brand";
import { LoginButton } from "../components/loginButton";
import { MenuButton } from "../components/menuButton";
import { MenuIcon } from "../components/menuIcon";

export default function Index() {
    useFonts({ Courgette_400Regular, Roboto_400Regular });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <MenuIcon color="#88c9bf" />
            </View>
            <View style={styles.body}>
                <Text style={styles.title}>Olá!</Text>
                <Text style={styles.text}>
                    Bem vindo ao Meau!{'\n'}
                    Aqui você pode adotar, doar e ajudar{'\n'}
                    cães e gatos com facilidade.{'\n'}
                    Qual o seu interesse?
                </Text>
                <View style={styles.options}>
                    <MenuButton text="ADOTAR" />
                    <MenuButton text="AJUDAR" />
                    <MenuButton text="CADASTRAR ANIMAL" />
                </View>
                <View style={styles.login}>
                    <LoginButton />
                </View>
                <View style={styles.brand}>
                    <Brand />
                </View>
            </View>
            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    header: {
        margin: 12,
    },
    body: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Courgette_400Regular',
        fontSize: 72,
        textAlign: 'center',
        color: '#ffd358',
        marginTop: 8,
    },
    text: {
        fontFamily: 'Roboto_400Regular',
        fontSize: 16,
        textAlign: 'center',
        color: '#757575',
        marginTop: 52,
    },
    options: {
        marginTop: 48,
        gap: 12,
    },
    login: {
        marginTop: 44,
    },
    brand: {
        marginTop: 68,
    }
});
