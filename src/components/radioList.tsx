import { View } from "react-native";
import { RadioButton } from "./radioButton";

type RadioListProps = {
  items?: string[];
  value?: string;
  onChange?: (value: string) => void;
};

export function RadioList({ items = [], value = "", onChange = () => {} }: RadioListProps) {
  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {items.map((item) => (
        <RadioButton
          key={item}
          text={item}
          selected={value === item}
          onPress={() => {
            onChange(item);
          }}
        />
      ))}
      {items.length < 3 ? <View style={{ flex: 1 }} /> : <View />}
    </View>
  );
}
