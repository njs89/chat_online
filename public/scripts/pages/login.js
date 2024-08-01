import { login, registerWithGoogle } from '../common/auth.js'; // Import the functions from auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const googleLoginButton = document.getElementById('googleLoginButton');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent the default form submission
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            login(email, password)
                .then(() => {
                    console.log('User logged in successfully');
                    window.location.href = '/learnhub.html'; // Redirect to learnhub.html upon successful login
                })
                .catch(error => {
                    console.error('Login failed:', error.message);
                    alert('Login failed: ' + error.message); // Show an alert on login failure
                });
        });
    }

    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', () => {
            registerWithGoogle()
                .then(() => {
                    console.log('User logged in with Google successfully');
                    window.location.href = '/learnhub.html'; // Redirect to learnhub.html upon successful login
                })
                .catch(error => {
                    console.error('Google Login Failed:', error.message);
                    alert('Google Login Failed: ' + error.message); // Show an alert on login failure
                });
        });
    }
});