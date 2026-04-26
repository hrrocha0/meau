import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyB0kr53HPYz2lCUZH2gcB1h61-WG2xYwO4",
    authDomain: "meau-hrrocha.firebaseapp.com",
    projectId: "meau-hrrocha",
    storageBucket: "meau-hrrocha.firebasestorage.app",
    messagingSenderId: "7488868550",
    appId: "1:7488868550:web:73f7e0d05ceb3ad0c347c7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;
