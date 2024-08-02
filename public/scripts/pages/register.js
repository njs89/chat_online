import { initializeFirebase } from '../common/firebaseConfig.js';
import { register, registerWithGoogle, updateUserProfile } from '../common/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, googleProvider } = await initializeFirebase(); // Now fetched from firebaseConfig.js
    const registerForm = document.getElementById('registerForm');
    const googleRegisterButton = document.getElementById('googleRegisterButton');
    const confirmationPopup = document.getElementById('confirmationPopup');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    let pendingCredential;

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('name').value;
            const gender = document.getElementById('gender').value;
            const hobbies = document.getElementById('hobbies').value.split(',').map(hobby => hobby.trim());
            const aboutYou = document.getElementById('aboutYou').value;
        
            try {
                const userCredential = await register(auth, email, password);
                await updateUserProfile(userCredential.user, name, gender, hobbies, aboutYou);
                console.log('User registered and profile updated successfully');
                window.location.href = '/mainpage.html';
            } catch (error) {
                console.error('Registration failed:', error.message);
                alert('Registration failed: ' + error.message);
            }
        });
    }

    if (googleRegisterButton) {
        googleRegisterButton.addEventListener('click', async () => {
            await registerWithGoogle(auth, googleProvider)
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
        pendingCredential = null;
    });
});