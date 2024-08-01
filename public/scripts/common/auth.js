   import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
   import { auth, googleProvider } from './firebaseConfig.js';

   export function register(email, password) {
       return createUserWithEmailAndPassword(auth, email, password)
           .catch(error => {
               console.error('Registration Error:', error.code, error.message);
           });
   }

   export function login(email, password) {
       return signInWithEmailAndPassword(auth, email, password)
           .catch(error => {
               console.error('Login Error:', error.code, error.message);
           });
   }

   export function registerWithGoogle() {
       return signInWithPopup(auth, googleProvider)
           .catch(error => {
               console.error('Google Registration Error:', error.code, error.message);
           });
   }

   export function logout() {
       return signOut(auth)
           .then(() => {
               console.log('User successfully logged out');
           })
           .catch(error => {
               console.error('Logout Error:', error.code, error.message);
           });
   }