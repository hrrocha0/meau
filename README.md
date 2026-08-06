# Meau — Adoção de Animais

**Disciplina**: Desenvolvimento de Aplicativos (CIC0226) — UnB, 2026.1

## Equipe

| | Matrícula | Aluno | Curso | GitHub |
|-|-----------|-------|-------|--------|
| <img src="https://github.com/GustavommBarreto.png?size=32" width="32" style="border-radius: 50%;" /> | 232026414 | Gustavo Mourão Mena Barreto | Ciência da Computação | [@GustavommBarreto](https://github.com/GustavommBarreto) |
| <img src="https://github.com/hrrocha0.png?size=32" width="32" style="border-radius: 50%;" /> | 211036061 | Henrique Rodrigues Rocha | Ciência da Computação | [@hrrocha0](https://github.com/hrrocha0) |
| <img src="https://github.com/tomasvelos0.png?size=32" width="32" style="border-radius: 50%;" /> | 180138596 | Tomás Veloso Peixoto Matutino | Engenharia de Software | [@tomasvelos0](https://github.com/tomasvelos0) |

## Sobre

O **Meau** é um aplicativo mobile de adoção de animais desenvolvido com [Expo](https://docs.expo.dev/) e [React Native](https://reactnative.dev/), utilizando [Firebase](https://firebase.google.com/) como backend. O app conecta pessoas que desejam adotar animais com pessoas que desejam doá-los, facilitando o processo de adoção de cães e gatos.

## Funcionalidades

- [x] Autenticação de usuários (e-mail e senha)
- [x] Cadastro de animais para adoção com fotos e localização
- [x] Listagem de animais disponíveis para adoção
- [x] Mapa global com animais próximos ao usuário (raio de 50km, coordenadas aproximadas por privacidade)
- [x] Chat em tempo real entre interessado e dono do animal
- [x] Processo de adoção com aceite ou recusa pelo dono diretamente no chat
- [x] Transferência automática do animal ao aceitar a adoção
- [x] Notificações push para novas mensagens e solicitações de adoção
- [x] Favoritos

## Tecnologias

- **Frontend**: Expo / React Native / TypeScript
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Notificações**: Expo Notifications + Firebase Cloud Messaging (FCM)
- **Mapas**: react-native-maps + expo-location
- **Build**: EAS Build

## Instalação e execução

> **Requisito**: [Node.js](https://nodejs.org/) instalado.

```bash
npm install
```

> **Atenção**: O projeto utiliza bibliotecas com código nativo (`react-native-maps`, `expo-notifications`) e **não é compatível com o Expo Go**. É necessário um [development build](https://docs.expo.dev/develop/development-builds/introduction/).

### Executar em development build

```bash
npx expo start --dev-client --tunnel
```

Escaneie o QR Code com o app do Expo Dev Client instalado no celular.

### Gerar APK (Android)

```bash
eas build --profile preview --platform android
```

### Gerar build de desenvolvimento

```bash
eas build --profile development --platform android
```

## Configuração

O projeto requer os seguintes arquivos de configuração **não versionados**:

- `google-services.json` — obtido no [Firebase Console](https://console.firebase.google.com/) em Configurações do projeto → Seus aplicativos → Android

As chaves do Firebase estão configuradas diretamente em `firebaseConfig.ts`.