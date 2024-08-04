import { initializeFirebase } from '../common/firebaseConfig.js';
import { logout } from '../common/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth } = await initializeFirebase();
    const logoutButton = document.getElementById('logoutButton');

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = '/index.html';
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await logout(auth);
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    });
});