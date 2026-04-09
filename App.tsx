import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
//import { Home } from './Home';
import Login from './Login';

export default function App() {
  return (
    <SafeAreaProvider>
      <Login />
      
      <StatusBar style='auto' />
    </SafeAreaProvider>
  );
}
