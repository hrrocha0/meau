import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, TouchableOpacity } from "react-native";

type RadioButtonProps = {
    text?: string,
    selected?: boolean
    onPress?: () => void,
};

export function RadioButton({ text = "", selected = false, onPress = () => { } }: RadioButtonProps) {
    return (
        <TouchableOpacity
            style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 2 }}
            onPress={onPress}
        >
            <>
                <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={24} color="#757575" />
            <Text style={{
                textAlign: "left",
                fontFamily: "Roboto_400Regular",
                fontSize: 14,
                color: "#757575",
            }}>{text}</Text>
            </>
        </TouchableOpacity>
    );
}
