import { View } from "react-native";
import { Checkbox } from "../checkbox";

type ChecklistProps = {
    items?: string[],
};

export function Checklist({ items = [] }: ChecklistProps) {
    return (
        <View style={{ flex: 1, flexDirection: "row" }}>
            {items.map((item) => <Checkbox text={item} />)}
            {items.length < 3 ? <View style={{ flex: 1 }} /> : <View />}
        </View>
    );
}
