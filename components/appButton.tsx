import { ColorValue, Text, TouchableOpacity } from "react-native";

type AppButtonProps = {
    text?: string,
    backgroundColor?: ColorValue | undefined,
    textColor?: ColorValue | undefined,
    onPress?: () => void,
};

export function AppButton({ text = "", backgroundColor = "silver", textColor = "black", onPress = () => { } }: AppButtonProps) {
    return (
        <TouchableOpacity style={{
            justifyContent: "center",
            alignItems: "center",
            width: 232,
            height: 40,
            borderRadius: 2,
            elevation: 4,
            backgroundColor: backgroundColor,
        }} onPress={onPress}>
            <Text style={{
                textAlign: "center",
                fontFamily: "Roboto_400Regular",
                fontSize: 12,
                color: textColor
            }}>{text}</Text>
        </TouchableOpacity>
    );
}
