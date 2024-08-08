import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyDTawWe_8m8aBzePaMGllkNlqa5BWS5l9M",
  authDomain: "chatapp-a578b.firebaseapp.com",
  projectId: "chatapp-a578b",
  storageBucket: "chatapp-a578b.appspot.com",
  messagingSenderId: "632313227229",
  appId: "1:632313227229:web:da8cf56480f295d54eb834"
};

function initializeFirebase() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const googleProvider = new GoogleAuthProvider();
  return { auth, db, storage, googleProvider };
}

export { initializeFirebase };