import Ionicons from "@expo/vector-icons/Ionicons";
import { DimensionValue, Text, TouchableOpacity } from "react-native";
import { colors } from "../../constants";

type ImageButtonProps = {
  width?: DimensionValue | undefined;
  height?: DimensionValue | undefined;
  text?: string;
  onPress?: () => void;
};

export function ImageButton({
  width = 128,
  height = 128,
  text = "adicionar foto",
  onPress = () => {},
}: ImageButtonProps) {
  return (
    <TouchableOpacity
      style={{
        justifyContent: "center",
        alignItems: "center",
        width: width,
        height: height,
        borderRadius: 2,
        elevation: 4,
        backgroundColor: colors.surfaceContainer,
      }}
      onPress={onPress}
    >
      <Ionicons name="add-circle-outline" size={24} color={colors.onSurfaceContainer} />
      <Text
        style={{
          textAlign: "center",
          fontFamily: "Roboto_400Regular",
          fontSize: 14,
          color: colors.onSurfaceContainer,
        }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}
