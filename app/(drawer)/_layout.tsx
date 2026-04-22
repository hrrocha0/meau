import { Drawer } from "expo-router/drawer";
import CustomDrawerContent from "../../components/CustomDrawerContent";

export default function DrawerLayout() {
    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Drawer.Screen
                name="index"
                options={{
                    drawerLabel: "Home",
                }}
            />
        </Drawer>
    );
}
