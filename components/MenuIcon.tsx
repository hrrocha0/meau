import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function MenuIcon() {
    return (
        <Ionicons style={styles.icon} name="menu" size={24} color="#88c9bf" />
    )
}

const styles = StyleSheet.create({
    icon: {
        position: 'absolute',
        alignSelf: 'flex-start',
        margin: 12,
    },
});
