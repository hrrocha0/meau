import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type CheckboxProps = {
    text?: string,
    disabled?: boolean,
    selected?: boolean,
    onToggle?: (selected: boolean) => void,
};

export function Checkbox({ text = "", disabled = false, selected = false, onToggle = (_) => { } }: CheckboxProps) {
    return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 2 }}>
            <TouchableOpacity disabled={disabled} onPress={() => {
                onToggle(!selected);
            }}>
                <Ionicons name={selected ? "checkbox-outline" : "square-outline"} size={24} color={disabled ? "#bdbdbd" : "#757575"} />
            </TouchableOpacity>
            <Text style={{
                textAlign: "left",
                fontFamily: "Roboto_400Regular",
                fontSize: 14,
                color: disabled ? "#bdbdbd" : "#757575",
            }}>{text}</Text>
        </View>
    );
}
