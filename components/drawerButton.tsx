import { Ionicons } from "@expo/vector-icons";
import { ColorValue, TouchableOpacity } from "react-native";

type DrawerButtonProps = {
    color?: ColorValue | undefined,
    onPress?: () => void,
}

export function DrawerButton({ color = "black", onPress = () => { } }: DrawerButtonProps) {
    return (
        <TouchableOpacity onPress={onPress}>
            <Ionicons name="menu" size={24} color={color} />
        </TouchableOpacity>
    );
}
