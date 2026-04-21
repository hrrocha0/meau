import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CORES = {
    verdeHeader: '#88c9bf',
    verdeTextoOps: '#88c9bf',
    cinzaTexto: '#575757',
    cinzaSubtitulo: '#757575',
    fundo: '#fafafa'
};

export default function Error() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Header com Seta de Voltar */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color={CORES.cinzaTexto} onPress={() => { router.back() }} />
                <Text style={styles.headerTitle}>Cadastro</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Conteúdo Centralizado */}
            <View style={styles.content}>
                <Text style={styles.tituloOps}>Ops!</Text>

                <Text style={styles.textoInformativo}>
                    Você não pode realizar esta ação sem possuir um cadastro.
                </Text>

                <TouchableOpacity style={styles.botaoPadrao} onPress={() => { router.navigate("/signup") }}>
                    <Text style={styles.botaoText}>FAZER CADASTRO</Text>
                </TouchableOpacity>

                <Text style={styles.perguntinha}>Já possui cadastro?</Text>

                <TouchableOpacity style={styles.botaoPadrao} onPress={() => { router.navigate("/login") }}>
                    <Text style={styles.botaoText}>FAZER LOGIN</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CORES.fundo },
    header: {
        height: 80,
        backgroundColor: CORES.verdeHeader,
        paddingTop: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 15,
        elevation: 4,
    },
    headerTitle: { fontSize: 20, color: CORES.cinzaTexto, fontWeight: '500', marginLeft: 20 },
    content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center' },
    tituloOps: {
        fontSize: 64,
        color: CORES.verdeTextoOps,
        fontStyle: 'italic',
        fontWeight: '300',
        marginBottom: 40,
    },
    textoInformativo: {
        fontSize: 18,
        color: CORES.cinzaSubtitulo,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    botaoPadrao: {
        width: '100%',
        height: 50,
        backgroundColor: CORES.verdeHeader,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        elevation: 2,
    },
    botaoText: { color: CORES.cinzaTexto, fontSize: 14, fontWeight: 'bold' },
    perguntinha: {
        fontSize: 16,
        color: CORES.cinzaSubtitulo,
        marginBottom: 10,
        marginTop: 20,
    }
});
