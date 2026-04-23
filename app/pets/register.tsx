import { Roboto_400Regular, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../components/appButton";
import { Checkbox } from "../../components/checkbox";
import { ImageButton } from "../../components/imageButton";
import { Checklist } from "../../components/input/checklist";
import { RadioList } from "../../components/input/radioList";
import { InputField } from "../../components/inputField";
import { colors } from "../../constants";

export default function Register() {
    const [extraCheckboxesEnabled, setExtraCheckboxesEnabled] = useState(false);
    // Carrega o router para a navegação entre telas

    const router = useRouter();

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
            <StatusBar style="dark" />
            <View style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ margin: 16 }}>
                            <TouchableOpacity onPress={() => { router.back() }}>
                                <Ionicons name="arrow-back" size={24} color={colors.onPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ margin: 16 }}>
                            <Text style={styles.text0}>Cadastro do Animal</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
            <View style={styles.body}>
                <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
                    <ScrollView contentContainerStyle={{ alignItems: "center" }}>
                        <View style={{ margin: 16 }}>
                            <Text style={styles.text1}>Tenho interesse em cadastrar o animal para:</Text>
                        </View>
                        <View style={{ flexDirection: "row", marginHorizontal: 24, gap: 8 }}>
                            <AppButton width={100} backgroundColor={colors.primary} textColor={colors.onPrimary} text="ADOÇÃO" />
                            <AppButton width={100} backgroundColor="#f1f2f2" textColor="#bdbdbd" text="APADRINHAR" />
                            <AppButton width={100} backgroundColor="#f1f2f2" textColor="#bdbdbd" text="AJUDA" />
                        </View>
                        <View>
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.text2}>Adoção</Text>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>NOME DO ANIMAL</Text>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <InputField placeholder="Nome do animal" />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>FOTOS DO ANIMAL</Text>
                            </View>
                            <View style={{ alignItems: "center", marginTop: 16 }}>
                                <ImageButton width={312} height={128} text="adicionar fotos" />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>ESPÉCIE</Text>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Cachorro", "Gato"]} />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>SEXO</Text>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Macho", "Fêmea"]} />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>PORTE</Text>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Pequeno", "Médio", "Grande"]} />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>IDADE</Text>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Filhote", "Adulto", "Idoso"]} />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>TEMPERAMENTO</Text>
                            </View>
                            <View style={{ marginTop: 16, gap: 28 }}>
                                <Checklist items={["Brincalhão", "Tímido", "Calmo"]} />
                                <Checklist items={["Guarda", "Amoroso", "Preguiçoso"]} />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>SAÚDE</Text>
                            </View>
                            <View style={{ marginTop: 16, gap: 28 }}>
                                <Checklist items={["Vacinado", "Vermifugado"]} />
                                <Checklist items={["Castrado", "Doente"]} />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <InputField placeholder="Doenças do animal" />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>EXIGÊNCIAS PARA ADOÇÃO</Text>
                            </View>
                            <View style={{ marginTop: 20, gap: 28 }}>
                                <Checkbox text="Termos de adoção" />
                                <Checkbox text="Fotos da casa" />
                                <Checkbox text="Visita prévia ao animal" />
                                <Checkbox text="Acompanhamento pós adoção" onToggle={(selected) => { setExtraCheckboxesEnabled(selected) }} />
                                <View style={{ marginLeft: 60, gap: 28 }}>
                                    <Checkbox text="1 mês" disabled={!extraCheckboxesEnabled} />
                                    <Checkbox text="3 meses" disabled={!extraCheckboxesEnabled} />
                                    <Checkbox text="6 meses" disabled={!extraCheckboxesEnabled} />
                                </View>
                            </View>
                            <View style={{ marginTop: 28 }}>
                                <Text style={styles.text3}>SOBRE O ANIMAL</Text>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <InputField placeholder="Compartilhe a história do animal" />
                            </View>
                        </View>
                        <View style={{ marginVertical: 24 }}>
                            <AppButton text="COLOCAR PARA ADOÇÃO" backgroundColor="#ffd358" textColor="#434343" />
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
        backgroundColor: colors.primary,
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
        color: colors.onSurfaceContainer,
    },
    text2: {
        textAlign: "left",
        fontFamily: "Roboto_500Medium",
        fontSize: 16,
        color: "#434343",
    },
    text3: {
        textAlign: "left",
        fontFamily: "Roboto_400Regular",
        fontSize: 12,
        color: "#f7a800",
    },
    text4: {
        textAlign: "left",
        fontFamily: "Roboto_400Regular",
        fontSize: 14,
        color: "#757575",
    },
    text5: {
        textAlign: "left",
        fontFamily: "Roboto_400Regular",
        fontSize: 14,
        color: "#bdbdbd",
    }
});
