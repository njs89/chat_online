import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

export function register(auth, email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
        .catch(error => {
            console.error('Registration Error:', error.code, error.message);
        });
}

export function login(auth, email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            console.error('Login Error:', error.code, error.message);
        });
}

export function registerWithGoogle(auth, googleProvider) {
    return signInWithPopup(auth, googleProvider)
        .catch(error => {
            console.error('Google Registration Error:', error.code, error.message);
        });
}

export function logout(auth) {
    return signOut(auth)
        .then(() => {
            console.log('User successfully logged out');
        })
        .catch(error => {
            console.error('Logout Error:', error.code, error.message);
        });
}