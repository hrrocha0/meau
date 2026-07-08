import { ReactElement } from "react";
import { ColorValue, DimensionValue, View } from "react-native";

type CardProps = {
    children?: ReactElement,
    width?: DimensionValue | undefined,
    height?: DimensionValue | undefined,
    backgroundColor?: ColorValue | undefined,
};

export function Card({ children, width, height, backgroundColor = "silver" }: CardProps) {
    return (
        <View style={{
            justifyContent: "center",
            alignItems: "center",
            width: width,
            height: height,
            borderRadius: 4,
            backgroundColor: backgroundColor,
        }}>{children}</View>
    );
}
