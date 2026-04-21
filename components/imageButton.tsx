import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";
import { colors } from "../constants";

type ImageButtonProps = {
    onPress?: () => void,
};

export function ImageButton({ onPress = () => { } }: ImageButtonProps) {
    return (
        <TouchableOpacity style={{
            justifyContent: "center",
            alignItems: "center",
            width: 128,
            height: 128,
            borderRadius: 2,
            elevation: 4,
            backgroundColor: colors.surfaceContainer,
        }} onPress={onPress}>
            <Ionicons name="add-circle-outline" size={24} color={colors.onSurfaceContainer} />
            <Text style={{
                textAlign: "center",
                fontFamily: "Roboto_400Regular",
                fontSize: 14,
                color: colors.onSurfaceContainer,
            }}>adicionar foto</Text>
        </TouchableOpacity>
    );
}
