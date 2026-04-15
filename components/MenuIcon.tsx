import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";

export function MenuIcon({color = '#ffffff'}) {
    return (
        <Ionicons style={styles.icon} name="menu" size={24} color={color}/>
    )
}

const styles = StyleSheet.create({
    icon: {
    },
});
