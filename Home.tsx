import { Text, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import { MenuButton } from "./components/MenuButton";
import { LoginButton } from "./components/LoginButton";
import { Brand } from "./components/Brand";
import { useFonts } from "expo-font";
import { Courgette_400Regular } from "@expo-google-fonts/courgette";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { MenuIcon } from "./components/MenuIcon";

export function Home() {
    useFonts({ Courgette_400Regular, Roboto_400Regular })

    return (
        <SafeAreaView style={styles.page}>
            <View>
                <MenuIcon />
                <Text style={styles.title}>Olá!</Text>
                <Text style={styles.text}>
                    Bem vindo ao Meau!{'\n'}
                    Aqui você pode adotar, doar e ajudar{'\n'}
                    cães e gatos com facilidade.{'\n'}
                    Qual o seu interesse?
                </Text>
            </View>
            <View style={styles.buttons}>
                <MenuButton text='ADOTAR' />
                <MenuButton text='AJUDAR' />
                <MenuButton text='CADASTRAR ANIMAL' />
                <LoginButton />
            </View>
            <Brand />
        </ SafeAreaView>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#fafafa',
    },
    title: {
        alignSelf: 'center',
        marginTop: 56,
        textAlign: 'center',
        fontFamily: 'Courgette_400Regular',
        fontSize: 72,
        color: '#ffd358',
    },
    text: {
        marginTop: 52,
        textAlign: 'center',
        fontFamily: 'Roboto_400Regular',
        fontSize: 16,
        color: '#757575',
    },
    buttons: {
        marginTop: 48,
    },
});
