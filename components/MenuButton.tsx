import { useFonts } from "@expo-google-fonts/courgette";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function MenuButton({ text = '' }) {
    const router = useRouter();

    useFonts({ Roboto_400Regular })

    return (
        <TouchableOpacity style={styles.button} onPress={() => { router.navigate('/error') }}>
            <Text style={styles.text}>{text}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        width: 232,
        height: 40,
        borderRadius: 2,
        elevation: 4,
        justifyContent: 'center',
        backgroundColor: '#ffd358',
    },
    text: {
        fontFamily: 'Roboto_400Regular',
        fontSize: 12,
        textAlign: 'center',
        color: '#434343',
    }
});
