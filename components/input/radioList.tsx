import { useState } from "react";
import { View } from "react-native";
import { RadioButton } from "../radioButton";

type RadioListProps = {
    items?: string[],
};

export function RadioList({ items = [] }: RadioListProps) {
    const [selected, setSelected] = useState(0);

    return (
        <View style={{ flex: 1, flexDirection: "row" }}>
            {items.map((item) => <RadioButton text={item} selected={selected === items.indexOf(item)} onPress={() => { setSelected(items.indexOf(item)) }} />)}
            {items.length < 3 ? <View style={{ flex: 1 }} /> : <View />}
        </View>
    );
}
