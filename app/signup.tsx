import { Roboto_400Regular, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { useFonts } from "expo-font";
import { SplashScreen, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../components/appButton";
import { Card } from "../components/card";
import { DrawerButton } from "../components/drawerButton";
import { ImageButton } from "../components/imageButton";
import { InputField } from "../components/inputField";
import { colors } from "../constants";

export default function SignUp() {
    // Carrega o router para a navegação entre telas

    const router = useRouter();

    // Lógica de cadastro pessoal

    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [email, setEmail] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [telephone, setTelephone] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    function registerUser() {
        const formData = [name, age, email, state, city, address, telephone, username, password, passwordConfirm];

        if (formData.some((field) => field === "")) {
            alert("Por favor, preencha todos os campos.");
            return null;
        }
        if (password != passwordConfirm) {
            alert("As senhas não coincidem.");
            return null;
        }
        console.log(formData.slice(0, 8));
        alert(`Usuário ${username} cadastrado com sucesso!`);

        router.navigate("/");
    }

    // Carrega as fontes utilizadas na página

    const [loaded, error] = useFonts({ Roboto_400Regular, Roboto_500Medium });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    // Implementação da tela

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ margin: 16 }}>
                            <DrawerButton color={colors.onSecondaryContainer} />
                        </View>
                        <View style={{ margin: 16 }}>
                            <Text style={styles.text0}>Cadastro Pessoal</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
            <View style={styles.body}>
                <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
                    <ScrollView contentContainerStyle={{ alignItems: "center" }}>
                        <View style={{ marginTop: 16 }}>
                            <Card width={328} height={80} backgroundColor={colors.secondaryContainer}>
                                <Text style={styles.text1}>
                                    As informações preenchidas serão divulgadas{`\n`}
                                    apenas para a pessoa com a qual você realizar{`\n`}
                                    o processo de adoção e/ou apadrinhamento,{`\n`}
                                    após a formalização do processo.
                                </Text>
                            </Card>
                        </View>
                        <View style={{ marginHorizontal: 16 }}>
                            <View style={{ marginHorizontal: 12, marginTop: 28 }}>
                                <Text style={styles.text2}>INFORMAÇÕES PESSOAIS</Text>
                            </View>
                            <View style={{ marginTop: 32, gap: 36 }}>
                                <InputField placeholder="Nome completo" onChangeText={setName} />
                                <InputField placeholder="Idade" inputMode="numeric" onChangeText={setAge} />
                                <InputField placeholder="E-mail" inputMode="email" onChangeText={setEmail} />
                                <InputField placeholder="Estado" onChangeText={setState} />
                                <InputField placeholder="Cidade" onChangeText={setCity} />
                                <InputField placeholder="Endereço" onChangeText={setAddress} />
                                <InputField placeholder="Telefone" inputMode="tel" onChangeText={setTelephone} />
                            </View>
                            <View style={{ marginHorizontal: 12, marginTop: 28 }}>
                                <Text style={styles.text2}>INFORMAÇÕES DE PERFIL</Text>
                            </View>
                            <View style={{ marginTop: 32, gap: 36 }}>
                                <InputField placeholder="Nome de usuário" onChangeText={setUsername} />
                                <InputField placeholder="Senha" secureTextEntry onChangeText={setPassword} />
                                <InputField placeholder="Confirmação de senha" secureTextEntry onChangeText={setPasswordConfirm} />
                            </View>
                            <View style={{ marginHorizontal: 12, marginTop: 28 }}>
                                <Text style={styles.text2}>FOTO DE PERFIL</Text>
                            </View>
                            <View style={{ alignItems: "center", marginTop: 32 }}>
                                <ImageButton />
                            </View>
                            <View style={{ alignItems: "center", marginTop: 32, marginBottom: 24 }}>
                                <AppButton text="FAZER CADASTRO" backgroundColor={colors.secondary} textColor={colors.onSecondary} onPress={registerUser} />
                            </View>
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
    },
    header: {
        elevation: 4,
        backgroundColor: colors.secondaryContainer,
    },
    body: {
        flex: 1,
    },
    text0: {
        textAlign: "left",
        fontFamily: "Roboto_500Medium",
        fontSize: 20,
        color: colors.onSecondaryContainer,
    },
    text1: {
        textAlign: "center",
        fontFamily: "Roboto_400Regular",
        fontSize: 14,
        color: colors.onSecondaryContainer,
    },
    text2: {
        textAlign: "left",
        fontFamily: "Roboto_400Regular",
        fontSize: 14,
        color: colors.secondary,
    },
});
