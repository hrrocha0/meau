import { InputModeOptions, TextInput, View } from "react-native";
import { colors } from "../constants";

type InputFieldProps = {
    placeholder?: string,
    inputMode?: InputModeOptions | undefined,
    secureTextEntry?: boolean,
    onChangeText?: (_: string) => void,
};

export function InputField({ placeholder, inputMode = "text", secureTextEntry = false, onChangeText = (_) => { } }: InputFieldProps) {
    return (
        <View style={{ gap: 8 }}>
            <View style={{ marginHorizontal: 12, }}>
                <TextInput style={{
                    width: 304,
                    textAlign: "left",
                    fontFamily: "Roboto_400Regular",
                    fontSize: 14,
                    color: colors.onSurfaceLowest,
                }} placeholder={placeholder} placeholderTextColor={colors.onSurfaceBrightest} inputMode={inputMode} autoCapitalize="none" secureTextEntry={secureTextEntry} onChangeText={onChangeText} />
            </View>
            <View style={{
                width: 328,
                height: 0.8,
                backgroundColor: colors.surfaceContainer,
            }}></View>
        </View>
    );
}
