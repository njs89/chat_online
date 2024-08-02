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
    const imageCarousel = document.getElementById('imageCarousel');
    const carouselImage = document.getElementById('carouselImage');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    let currentImageIndex = 0;
    let userImages = [];


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
                
                // Handle user images
                userImages = userData.profileImages || [];
                if (userImages.length > 0) {
                    imageCarousel.style.display = 'flex';
                    updateCarouselImage();
                } else {
                    imageCarousel.style.display = 'none';
                }
            } else {
                console.log("No user data found!");
            }
        } else {
            window.location.href = '/index.html';
        }
    });

    function updateCarouselImage() {
        carouselImage.src = userImages[currentImageIndex];
    }

    prevButton.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + userImages.length) % userImages.length;
        updateCarouselImage();
    });

    nextButton.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % userImages.length;
        updateCarouselImage();
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