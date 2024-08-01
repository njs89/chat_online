import { initializeFirebase } from '../common/firebaseConfig.js'; // Import initializeFirebase function
import { login, registerWithGoogle } from '../common/auth.js'; // Import the functions from auth.js

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, googleProvider } = await initializeFirebase(); // Dynamically fetch auth and googleProvider from firebaseConfig.js

    const loginForm = document.getElementById('loginForm');
    const googleLoginButton = document.getElementById('googleLoginButton');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            await login(auth, email, password) // Pass auth to login function
                .then(() => {
                    console.log('User logged in successfully');
                    window.location.href = '/mainpage.html'; // Redirect to mainpage.html upon successful login
                })
                .catch(error => {
                    console.error('Login failed:', error.message);
                    alert('Login failed: ' + error.message); // Show an alert on login failure
                });
        });
    }

    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', async () => {

            await registerWithGoogle(auth, googleProvider) // Pass auth and googleProvider to registerWithGoogle function
                .then(() => {
                    console.log('User logged in with Google successfully');
                    window.location.href = '/mainpage.html'; // Redirect to mainpage.html upon successful login
                })
                .catch(error => {
                    console.error('Google Login Failed:', error.message);
                    alert('Google Login Failed: ' + error.message); // Show an alert on login failure
                });
        });
    }
});