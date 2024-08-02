import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';


async function getFirebaseConfig() {
    try {
        const response = await fetch('/api/firebase-config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch Firebase config:", error);
        throw error;
    }
}

async function initializeFirebase() {
    try {
        const firebaseConfig = await getFirebaseConfig();
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        const googleProvider = new GoogleAuthProvider();
        return { auth, db, storage, googleProvider };
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        throw error;
    }
}

export { initializeFirebase };