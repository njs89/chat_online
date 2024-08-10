import { initializeFirebase } from '../common/firebaseConfig.js';
import { register, registerWithGoogle, updateUserProfile, uploadImages, checkIfEmailExists } from '../common/auth.js';
import { GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, storage } = await initializeFirebase();
    const loginForm = document.getElementById('registerForm');
    const googleLoginButton = document.getElementById('googleLoginButton');
    const confirmationPopup = document.getElementById('confirmationPopup');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    let pendingCredential;

    async function checkIfUserRegistered(userId) {
        const db = getFirestore();
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.isRegistered === true;
        }
        return false;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('User logged in successfully');
                window.location.href = '/mainpage.html';
            } catch (error) {
                console.error('Login failed:', error.message);
                alert('Login failed: ' + error.message);
            }
        });
    }

    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', handleGoogleAuth);
    }
    
    async function handleGoogleAuth() {
        try {
            console.log("Starting Google Authentication");
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            console.log("Google Authentication successful", user);
    
            const isNewUser = await checkIfNewUser(user);
            console.log("Is new user?", isNewUser);
    
            if (isNewUser) {
                console.log("User is not registered.");
                confirmationMessage.textContent = `There exists no account for ${user.email}. Do you want to register?`;
                confirmationPopup.classList.remove('hidden');
    
                confirmButton.onclick = async () => {
                    confirmationPopup.classList.add('hidden');
                    try {
                        console.log(`User ${user.email} forward to registration`);
                        window.location.href = '/register.html';
                    } catch (error) {
                        console.error('Error updating profile:', error);
                        alert('Failed to Login. Please try again.');
                        await auth.signOut();
                    }
                };
    
                cancelButton.onclick = async () => {
                    confirmationPopup.classList.add('hidden');
                    console.log('User cancelled the login');
                    await auth.signOut();
                };
            } else {
                console.log("Handling existing user");
                console.log(`User ${user.email} logged in`);
                window.location.href = '/mainpage.html';
            }               
        } catch (error) {
            console.error('Google Authentication Error:', error);
            console.error('Error details:', error.code, error.message);
            alert('Google Authentication Failed: ' + error.message);
        }
    }
    
    async function checkIfNewUser(user) {
        console.log("Checking if user is new:", user.uid);
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        
        try {
            const userDoc = await getDoc(userRef);
            console.log("User document exists:", userDoc.exists());
            
            if (!userDoc.exists()) {
                console.log("User document doesn't exist, treating as new user");
                return true;
            }
            
            const userData = userDoc.data();
            console.log("User data:", userData);
            
            if (userData.isRegistered === undefined) {
                console.log("isRegistered field doesn't exist, treating as new user");
                return true;
            }
            
            console.log("isRegistered value:", userData.isRegistered);
            return !userData.isRegistered;
        } catch (error) {
            console.error("Error checking if user is new:", error);
            // If there's an error, we'll treat the user as new to be safe
            return true;
        }
    }

    async function markUserAsRegistered(userId) {
        console.log("Marking user as registered:", userId);
        const db = getFirestore();
        const userRef = doc(db, "users", userId);
        try {   
            await setDoc(userRef, { isRegistered: true }, { merge: true });
            console.log("User marked as registered successfully");
        } catch (error) {
            console.error("Error marking user as registered:", error);
            throw error;
        }
    }
});