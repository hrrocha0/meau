import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function LoginButton() {
    const router = useRouter();

    useFonts({ Roboto_400Regular });

    return (
        <TouchableOpacity onPress={() => { router.navigate('/login') }}>
            <Text style={styles.text}>login</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    text: {
        fontFamily: 'Roboto_400Regular',
        fontSize: 16,
        textAlign: 'center',
        color: '#88c9bf',
    }
});
