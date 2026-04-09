import { Pressable, StyleSheet, Text } from "react-native";
import { useFonts } from "expo-font";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";

export function LoginButton() {
    useFonts({ Roboto_400Regular })

    return (
        <Pressable>
            <Text style={styles.text}>login</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    text: {
        marginTop: 44,
        textAlign: 'center',
        fontFamily: 'Roboto_400Regular',
        fontSize: 16,
        color: '#88c9bf',
    }
});
