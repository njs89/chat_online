import { initializeFirebase } from '../common/firebaseConfig.js'; // Import initializeFirebase instead of auth
import { logout } from '../common/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth } = await initializeFirebase(); // Initialize Firebase and get auth
  
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            logout(auth) // Pass auth to the logout function
                .then(() => {
                    console.log('User logged out successfully');
                    window.location.href = '/index.html';
                })
                .catch(error => {
                    console.error('Logout failed:', error.message);
                });
        });
    }

    // Additional mainpagespecific functionalities
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log(`Welcome ${user.email}`);
            // Additional user-specific logic here
        } else {
            console.log('No user is logged in');
        }
    });
});