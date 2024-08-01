import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAvqUCaekId2o0VskzHfkVVS1Orl2db_lU",
    authDomain: "lexai-738c2.firebaseapp.com",
    projectId: "lexai-738c2",
    storageBucket: "lexai-738c2.appspot.com",
    messagingSenderId: "608236651012",
    appId: "1:608236651012:web:687216a6c5b288fed66b51",
    measurementId: "G-7M8RGQFC4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };