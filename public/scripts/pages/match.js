import { initializeFirebase } from '../common/firebaseConfig.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, db } = await initializeFirebase();
    const matchProfiles = document.getElementById('matchProfiles');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const usersSnapshot = await getDocs(collection(db, "users"));
                usersSnapshot.forEach((doc) => {
                    if (doc.id !== user.uid) {
                        const userData = doc.data();
                        const profileElement = createProfileElement(userData);
                        matchProfiles.appendChild(profileElement);
                    }
                });
            } catch (error) {
                console.error("Error fetching user profiles:", error);
            }
        } else {
            window.location.href = '/index.html';
        }
    });

    function createProfileElement(userData) {
        const profileDiv = document.createElement('div');
        profileDiv.className = 'profile-card';
        profileDiv.innerHTML = `
            <h3>${userData.name}</h3>
            <p>Gender: ${userData.gender}</p>
            <p>Hobbies: ${userData.hobbies ? userData.hobbies.join(', ') : 'Not specified'}</p>
            <p>About: ${userData.aboutYou || 'Not specified'}</p>
        `;
        return profileDiv;
    }
});