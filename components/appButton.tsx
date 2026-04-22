import { ColorValue, DimensionValue, Text, TouchableOpacity } from "react-native";

type AppButtonProps = {
    width?: DimensionValue | undefined,
    text?: string,
    backgroundColor?: ColorValue | undefined,
    textColor?: ColorValue | undefined,
    onPress?: () => void,
};

export function AppButton({ width = 232, text = "", backgroundColor = "silver", textColor = "black", onPress = () => { } }: AppButtonProps) {
    return (
        <TouchableOpacity style={{
            justifyContent: "center",
            alignItems: "center",
            width: width,
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
