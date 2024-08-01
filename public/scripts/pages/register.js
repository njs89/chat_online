import { register, registerWithGoogle } from '../common/auth.js';  // Import from auth.js
import { auth } from '../common/firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const googleRegisterButton = document.getElementById('googleRegisterButton');
    const confirmationPopup = document.getElementById('confirmationPopup');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    let pendingCredential;

    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent the default form submission
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            register(email, password)
                .then(() => {
                    console.log('User registered successfully');
                    window.location.href = '/learnhub.html'; // Redirect to learnhub.html upon successful registration
                })
                .catch(error => {
                    console.error('Registration failed:', error.message);
                    alert('Registration failed: ' + error.message); // Show an alert on registration failure
                });
        });
    }

    if (googleRegisterButton) {
        googleRegisterButton.addEventListener('click', () => {
            registerWithGoogle()
                .then(credential => {
                    pendingCredential = credential;
                    confirmationMessage.textContent = `You are registering as ${credential.user.email}. Do you want to continue?`;
                    confirmationPopup.classList.remove('hidden');
                })
                .catch(error => {
                    console.error('Google Registration Failed:', error.message);
                });
        });
    }

    confirmButton.addEventListener('click', () => {
        confirmationPopup.classList.add('hidden');
        console.log(`User ${pendingCredential.user.email} confirmed registration`);
        window.location.href = '/mainpage.html';
    });

    cancelButton.addEventListener('click', () => {
        confirmationPopup.classList.add('hidden');
        console.log('User cancelled the registration');
        auth.signOut().then(() => {
            console.log('Cancelled user signed out');
        });
        pendingCredential = null;  // Discard the pending credentials
    });
});