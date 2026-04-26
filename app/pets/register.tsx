import { Roboto_400Regular, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { AppButton } from "../../components/appButton";
import { ImageButton } from "../../components/imageButton";
import { Checklist } from "../../components/input/checklist";
import { RadioList } from "../../components/input/radioList";
import { InputField } from "../../components/inputField";
import { colors } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebaseConfig";
import { pickImageFromCamera, pickImageFromGallery } from "../../utils/imagePicker";
import { uploadImageAsync } from "../../utils/uploadImage";

export default function Register() {
    const router = useRouter();
    const { isAuthResolved, user } = useAuth();

    const [animalName, setAnimalName] = useState("");
    const [species, setSpecies] = useState("");
    const [sex, setSex] = useState("");
    const [size, setSize] = useState("");
    const [ageGroup, setAgeGroup] = useState("");
    const [temperaments, setTemperaments] = useState<string[]>([]);
    const [healthItems, setHealthItems] = useState<string[]>([]);
    const [diseases, setDiseases] = useState("");
    const [about, setAbout] = useState("");
    const [petImageUri, setPetImageUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [loaded, error] = useFonts({ Roboto_400Regular, Roboto_500Medium });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    function resetForm() {
        setAnimalName("");
        setSpecies("");
        setSex("");
        setSize("");
        setAgeGroup("");
        setTemperaments([]);
        setHealthItems([]);
        setDiseases("");
        setAbout("");
        setPetImageUri(null);
        setIsSubmitting(false);
    }

    useEffect(() => {
        if (!isAuthResolved) {
            return;
        }

        if (!user) {
            router.replace("/error");
        }
    }, [isAuthResolved, router, user]);

    if (!loaded && !error) {
        return null;
    }

    if (!isAuthResolved || !user) {
        return null;
    }

    const currentUser = user;

    const missingFields = [
        animalName.trim().length >= 2 ? null : "nome",
        species.trim().length > 0 ? null : "espécie",
        sex.trim().length > 0 ? null : "sexo",
        size.trim().length > 0 ? null : "porte",
        ageGroup.trim().length > 0 ? null : "idade",
        about.trim().length >= 3 ? null : "descrição",
    ].filter(Boolean);

    const isFormValid = missingFields.length === 0;

    function choosePetImage() {
        Alert.alert("Foto do animal", "Escolha uma opção", [
            {
                text: "Câmera",
                onPress: async () => {
                    const uri = await pickImageFromCamera();
                    if (uri) {
                        setPetImageUri(uri);
                    }
                },
            },
            {
                text: "Galeria",
                onPress: async () => {
                    const uri = await pickImageFromGallery();
                    if (uri) {
                        setPetImageUri(uri);
                    }
                },
            },
            {
                text: "Cancelar",
                style: "cancel",
            },
        ]);
    }

    async function registerAnimal() {
        if (isSubmitting) {
            return;
        }

        if (!isFormValid) {
            alert(`Preencha os campos obrigatórios: ${missingFields.join(", ")}.`);
            return;
        }

        try {
            setIsSubmitting(true);

            let petImageUrl = "";

            if (petImageUri) {
                petImageUrl = await uploadImageAsync(
                    petImageUri,
                    `animals/${currentUser.uid}/${Date.now()}.jpg`
                );
            }

            await addDoc(collection(db, "animals"), {
                usuarioId: currentUser.uid,
                nome: animalName.trim(),
                finalidade: "adocao",
                especie: species,
                sexo: sex,
                porte: size,
                faixaEtaria: ageGroup,
                temperamentos: temperaments,
                saude: healthItems,
                doencas: diseases.trim(),
                descricao: about.trim(),
                fotoUrl: petImageUrl,
                criadoEm: serverTimestamp(),
            });

            resetForm();
            alert("Animal cadastrado com sucesso.");
            router.replace("/(drawer)");
        } catch (submitError: any) {
            console.error("Erro ao cadastrar animal:", submitError);
            alert(`Erro ao cadastrar animal: ${submitError.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <View style={styles.screen}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ margin: 16 }}>
                            <TouchableOpacity onPress={() => { router.back(); }}>
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
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={{ margin: 16 }}>
                            <Text style={styles.text1}>Tenho interesse em cadastrar o animal para:</Text>
                        </View>

                        <View style={{ flexDirection: "row", marginHorizontal: 24, gap: 8 }}>
                            <AppButton
                                width={100}
                                backgroundColor={colors.primary}
                                textColor={colors.onPrimary}
                                text="ADOÇÃO"
                            />
                        </View>

                        <View style={styles.formContainer}>
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.text2}>Adoção</Text>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>NOME DO ANIMAL</Text>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <InputField
                                    placeholder="Nome do animal"
                                    value={animalName}
                                    onChangeText={setAnimalName}
                                />
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>FOTOS DO ANIMAL</Text>
                            </View>

                            <View style={{ alignItems: "center", marginTop: 16 }}>
                                {petImageUri ? (
                                    <TouchableOpacity onPress={choosePetImage}>
                                        <Image
                                            source={{ uri: petImageUri }}
                                            style={styles.petImagePreview}
                                        />
                                    </TouchableOpacity>
                                ) : (
                                    <ImageButton
                                        width={312}
                                        height={128}
                                        text="adicionar fotos"
                                        onPress={choosePetImage}
                                    />
                                )}
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>ESPÉCIE</Text>
                            </View>

                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Cachorro", "Gato"]} value={species} onChange={setSpecies} />
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>SEXO</Text>
                            </View>

                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Macho", "Fêmea"]} value={sex} onChange={setSex} />
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>PORTE</Text>
                            </View>

                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Pequeno", "Médio", "Grande"]} value={size} onChange={setSize} />
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>IDADE</Text>
                            </View>

                            <View style={{ marginTop: 16 }}>
                                <RadioList items={["Filhote", "Adulto", "Idoso"]} value={ageGroup} onChange={setAgeGroup} />
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>TEMPERAMENTO</Text>
                            </View>

                            <View style={{ marginTop: 16, gap: 28 }}>
                                <Checklist
                                    items={["Brincalhão", "Tímido", "Calmo"]}
                                    selectedItems={temperaments}
                                    onChange={setTemperaments}
                                />
                                <Checklist
                                    items={["Guarda", "Amoroso", "Preguiçoso"]}
                                    selectedItems={temperaments}
                                    onChange={setTemperaments}
                                />
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.text3}>SAÚDE</Text>
                            </View>

                            <View style={{ marginTop: 16, gap: 28 }}>
                                <Checklist
                                    items={["Vacinado", "Vermifugado"]}
                                    selectedItems={healthItems}
                                    onChange={setHealthItems}
                                />
                                <Checklist
                                    items={["Castrado", "Doente"]}
                                    selectedItems={healthItems}
                                    onChange={setHealthItems}
                                />
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <InputField
                                    placeholder="Doenças do animal"
                                    value={diseases}
                                    onChangeText={setDiseases}
                                />
                            </View>

                            <View style={{ marginTop: 28 }}>
                                <Text style={styles.text3}>SOBRE O ANIMAL</Text>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <InputField
                                    placeholder="Compartilhe a história do animal"
                                    value={about}
                                    onChangeText={setAbout}
                                />
                            </View>
                        </View>

                        <View style={{ marginVertical: 24 }}>
                            <AppButton
                                text={isSubmitting ? "SALVANDO..." : "COLOCAR PARA ADOÇÃO"}
                                backgroundColor="#ffd358"
                                textColor="#434343"
                                onPress={registerAnimal}
                            />
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
    scrollContent: {
        alignItems: "center",
        paddingBottom: 24,
    },
    formContainer: {
        width: 328,
    },
    petImagePreview: {
        width: 312,
        height: 128,
        borderRadius: 8,
        resizeMode: "cover",
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