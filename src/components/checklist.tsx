import { View } from "react-native";
import { Checkbox } from "./checkbox";

type ChecklistProps = {
  items?: string[];
  selectedItems?: string[];
  onChange?: (selectedItems: string[]) => void;
};

export function Checklist({ items = [], selectedItems = [], onChange = () => {} }: ChecklistProps) {
  function handleToggle(item: string, selected: boolean) {
    if (selected) {
      onChange([...selectedItems, item]);
      return;
    }

    onChange(selectedItems.filter((currentItem) => currentItem !== item));
  }

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {items.map((item) => (
        <Checkbox
          key={item}
          text={item}
          selected={selectedItems.includes(item)}
          onToggle={(selected) => handleToggle(item, selected)}
        />
      ))}
      {items.length < 3 ? <View style={{ flex: 1 }} /> : <View />}
    </View>
  );
}
