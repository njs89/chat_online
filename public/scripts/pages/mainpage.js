import { initializeFirebase } from '../common/firebaseConfig.js';
import { logout } from '../common/auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, db } = await initializeFirebase();

    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userGender = document.getElementById('userGender');
    const userHobbies = document.getElementById('userHobbies');
    const userAbout = document.getElementById('userAbout');
    const editProfileButton = document.getElementById('editProfileButton');
    const logoutButton = document.getElementById('logoutButton');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userProfile.classList.remove('hidden');
            userEmail.textContent = user.email;

            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userName.textContent = userData.name || 'Not set';
                userGender.textContent = userData.gender || 'Not set';
                userHobbies.textContent = userData.hobbies ? userData.hobbies.join(', ') : 'Not set';
                userAbout.textContent = userData.aboutYou || 'Not set';
            } else {
                console.log("No user data found!");
            }
        } else {
            window.location.href = '/index.html';
        }
    });

    editProfileButton.addEventListener('click', () => {
        // Implement edit profile functionality
        console.log('Edit profile clicked');
        // You can redirect to an edit profile page or show a modal
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