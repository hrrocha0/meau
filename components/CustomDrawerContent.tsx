import { DrawerContentComponentProps } from "@react-navigation/drawer";
import DrawerMenuContent from "./DrawerMenuContent";

export default function CustomDrawerContent(
  props: DrawerContentComponentProps,
) {
  return <DrawerMenuContent onClose={() => props.navigation.closeDrawer()} />;
}
