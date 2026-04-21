import { ReactElement } from "react";
import { ColorValue, DimensionValue, View } from "react-native";

type CardProps = {
    width?: DimensionValue | undefined,
    height?: DimensionValue | undefined,
    backgroundColor?: ColorValue | undefined,
    children?: ReactElement,
};

export function Card({ width, height, backgroundColor, children }: CardProps) {
    return (
        <View style={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: width,
            height: height,
            borderRadius: 4,
            backgroundColor: backgroundColor,
        }}>{children}</View>
    );
}
