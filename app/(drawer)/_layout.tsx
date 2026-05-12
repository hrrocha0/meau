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
            <Drawer.Screen
                name="register-animal"
                options={{
                    drawerItemStyle: { display: "none" },
                }}
            />
            <Drawer.Screen
                name="adotar"
                options={{
                    drawerItemStyle: { display: "none" },
                }}
            />
            <Drawer.Screen
                name="signup"
                options={{
                    drawerItemStyle: { display: "none" },
                }}
            />
        </Drawer>
    );
}
