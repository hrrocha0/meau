import Ionicons from "@expo/vector-icons/Ionicons";
import { InputModeOptions, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../constants";

type InputFieldProps = {
    placeholder?: string,
    value?: string,
    inputMode?: InputModeOptions | undefined,
    secureTextEntry?: boolean,
    editable?: boolean,
    showDropdownIndicator?: boolean,
    status?: "default" | "invalid" | "valid",
    helperText?: string,
    onChangeText?: (_: string) => void,
    onPress?: () => void,
};

export function InputField({
    placeholder,
    value = "",
    inputMode = "text",
    secureTextEntry = false,
    editable = true,
    showDropdownIndicator = false,
    status = "default",
    helperText,
    onChangeText = (_) => { },
    onPress,
}: InputFieldProps) {
    const iconName = status === "valid" ? "checkmark-circle" : status === "invalid" ? "close-circle" : null;
    const iconColor = status === "valid" ? "#589b9b" : "#d9534f";

    return (
        <View style={styles.wrapper}>
            <Pressable
                style={styles.inputRow}
                onPress={onPress}
                disabled={!onPress}
            >
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={colors.onSurfaceBrightest}
                    inputMode={inputMode}
                    autoCapitalize="none"
                    secureTextEntry={secureTextEntry}
                    onChangeText={onChangeText}
                    value={value}
                    editable={editable}
                    pointerEvents={editable ? "auto" : "none"}
                />
                {iconName ? (
                    <Ionicons name={iconName} size={18} color={iconColor} />
                ) : null}
                {showDropdownIndicator ? (
                    <Ionicons name="chevron-down" size={18} color={colors.onSurfaceContainer} />
                ) : null}
            </Pressable>
            <View style={styles.line}></View>
            {helperText ? (
                <Text style={[
                    styles.helperText,
                    status === "invalid" ? styles.helperInvalid : null,
                    status === "valid" ? styles.helperValid : null,
                ]}>
                    {helperText}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: 8,
    },
    inputRow: {
        marginHorizontal: 12,
        minHeight: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    input: {
        flex: 1,
        textAlign: "left",
        fontFamily: "Roboto_400Regular",
        fontSize: 14,
        color: colors.onSurfaceLowest,
    },
    line: {
        width: 328,
        height: 0.8,
        backgroundColor: colors.surfaceContainer,
    },
    helperText: {
        marginHorizontal: 12,
        fontFamily: "Roboto_400Regular",
        fontSize: 12,
        color: colors.onSurfaceContainer,
    },
    helperInvalid: {
        color: "#d9534f",
    },
    helperValid: {
        color: "#589b9b",
    },
});
