import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Home } from './Home';

export default function App() {
  return (
    <SafeAreaProvider>
      <Home />
      <StatusBar style='auto' />
    </SafeAreaProvider>
  );
}
