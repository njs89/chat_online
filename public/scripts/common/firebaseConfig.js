import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

async function getFirebaseConfig() {
    const response = await fetch('/api/firebase-config');
    const firebaseConfig = await response.json();
    return firebaseConfig;
}

async function initializeFirebase() {
    const firebaseConfig = await getFirebaseConfig();
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    return { auth, googleProvider };
}

export { initializeFirebase };