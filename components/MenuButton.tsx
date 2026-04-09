import { Pressable, StyleSheet, Text } from "react-native";
import { useFonts } from "@expo-google-fonts/courgette";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";

export function MenuButton({ text = '' }) {
    useFonts({ Roboto_400Regular })

    return (
        <Pressable style={styles.button}>
            <Text style={styles.text}>{text}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        width: 232,
        height: 40,
        margin: 12,
        borderRadius: 2,
        elevation: 4,
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffd358',
    },
    text: {
        textAlign: 'center',
        fontFamily: 'Roboto_400Regular',
        fontSize: 12,
        color: '#434343',
    }
});
