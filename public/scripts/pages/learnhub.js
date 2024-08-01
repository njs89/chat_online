import { auth } from '../common/firebaseConfig.js'; // Import auth directly from firebaseConfig.js
import { logout } from '../common/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            logout()
                .then(() => {
                    console.log('User logged out successfully');
                    window.location.href = '/index.html';
                })
                .catch(error => {
                    console.error('Logout failed:', error.message);
                });
        });
    }
    
    // Additional Learn Hub-specific functionalities
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log(`Welcome ${user.email}`);
            // Additional user-specific logic here
        } else {
            console.log('No user is logged in');
        }
    });
});