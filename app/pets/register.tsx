import { Roboto_400Regular, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../components/appButton";
import { ImageButton } from "../../components/imageButton";
import { InputField } from "../../components/inputField";
import { colors } from "../../constants";

export default function Register() {
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
                            <View style={{ flexDirection: "row", marginTop: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Cachorro</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Gato</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>Sexo</Text>
                            </View>
                            <View style={{ flexDirection: "row", marginTop: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Macho</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Fêmea</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>PORTE</Text>
                            </View>
                            <View style={{ flexDirection: "row", marginTop: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Pequeno</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Médio</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 220 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Grande</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>IDADE</Text>
                            </View>
                            <View style={{ flexDirection: "row", marginTop: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Filhote</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Adulto</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 220 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="radio-button-off" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Idoso</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>TEMPERAMENTO</Text>
                            </View>
                            <View style={{ flexDirection: "row", marginTop: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Brincalhão</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Tímido</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 220 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Calmo</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: "row", marginTop: 28 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Guarda</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Amoroso</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 220 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Preguiçoso</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>SAÚDE</Text>
                            </View>
                            <View style={{ flexDirection: "row", marginTop: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Vacinado</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Vermifugado</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: "row", marginTop: 28 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Castrado</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", position: "absolute", marginLeft: 124 }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Doente</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <InputField placeholder="Doenças do animal" />
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>EXIGÊNCIAS PARA ADOÇÃO</Text>
                            </View>
                            <View style={{ marginTop: 20, gap: 28 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Termo de adoção</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Fotos da casa</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Visita prévia ao animal</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity>
                                        <Ionicons name="square-outline" size={24} color="#757575" />
                                    </TouchableOpacity>
                                    <Text style={styles.text4}>Acompanhamento pós adoção</Text>
                                </View>
                                <View style={{ marginLeft: 60, gap: 28 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <TouchableOpacity>
                                            <Ionicons name="square-outline" size={24} color="#bdbdbd" />
                                        </TouchableOpacity>
                                        <Text style={styles.text5}>1 mês</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <TouchableOpacity>
                                            <Ionicons name="square-outline" size={24} color="#bdbdbd" />
                                        </TouchableOpacity>
                                        <Text style={styles.text5}>3 meses</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <TouchableOpacity>
                                            <Ionicons name="square-outline" size={24} color="#bdbdbd" />
                                        </TouchableOpacity>
                                        <Text style={styles.text5}>6 meses</Text>
                                    </View>
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
