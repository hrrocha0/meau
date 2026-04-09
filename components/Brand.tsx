import { Image, StyleSheet } from "react-native"

export function Brand() {
    return (
        <Image style={styles.brand} source={require('../assets/Meau_marca_2.png')} />
    )
}

const styles = StyleSheet.create({
    brand: {
        width: 122,
        height: 44,
        marginTop: 68,
        alignSelf: 'center',
    },
});
