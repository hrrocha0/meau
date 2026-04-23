import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type CheckboxProps = {
    text?: string,
    disabled?: boolean,
    onToggle?: (selected: boolean) => void,
};

export function Checkbox({ text = "", disabled = false, onToggle = (_) => { } }: CheckboxProps) {
    const [selected, setSelected] = useState(false);

    return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 2 }}>
            <TouchableOpacity disabled={disabled} onPress={() => {
                setSelected(!selected);
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
