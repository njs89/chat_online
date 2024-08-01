import { auth } from '../common/firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.start-button');
    const testButton = document.querySelector('.test-button');

    if (startButton) {
        startButton.addEventListener('click', () => {
            window.location.href = '/register.html';
        });
    }

    if (testButton) {
        testButton.addEventListener('click', () => {
            window.location.href = '/selection.html';
        });
    }

    // Example: Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User is logged in');
        } else {
            console.log('No user is logged in');
        }
    });
});