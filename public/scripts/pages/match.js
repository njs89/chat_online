import { initializeFirebase } from '../common/firebaseConfig.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { initializeMenu } from '../common/menu.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeMenu();
    const { auth, db } = await initializeFirebase();
    const matchProfile = document.getElementById('matchProfile');
    const userName = document.getElementById('userName');
    const userGender = document.getElementById('userGender');
    const userHobbies = document.getElementById('userHobbies');
    const userAbout = document.getElementById('userAbout');
    const imageCarousel = document.getElementById('imageCarousel');
    const carouselImage = document.getElementById('carouselImage');
    const prevImageButton = document.getElementById('prevImageButton');
    const nextImageButton = document.getElementById('nextImageButton');
    const prevProfileButton = document.getElementById('prevProfileButton');
    const nextProfileButton = document.getElementById('nextProfileButton');
    const matchButton = document.getElementById('matchButton');
    const chatModal = document.getElementById('chatModal');
    const closeButton = document.querySelector('.close-button');
    const chatWindow = document.getElementById('chatWindow');
    const chatMessage = document.getElementById('chatMessage');
    const sendMessage = document.getElementById('sendMessage');

    let currentImageIndex = 0;
    let currentProfileIndex = 0;
    let profiles = [];

    const PLACEHOLDER_IMAGE_PATH = '/images/placeholder.png';

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const usersSnapshot = await getDocs(collection(db, "users"));
                profiles = usersSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(profile => profile.id !== user.uid);
                
                if (profiles.length > 0) {
                    matchProfile.classList.remove('hidden');
                    updateProfileDisplay(profiles[currentProfileIndex]);
                } else {
                    matchProfile.classList.add('hidden');
                    alert('No matching profiles found.');
                }
            } catch (error) {
                console.error("Error fetching user profiles:", error);
            }
        } else {
            window.location.href = '/index.html';
        }
    });

    function updateProfileDisplay(profile) {
        userName.textContent = profile.name || 'Not set';
        userGender.textContent = profile.gender || 'Not set';
        userHobbies.textContent = profile.hobbies ? profile.hobbies.join(', ') : 'Not set';
        userAbout.textContent = profile.aboutYou || 'Not set';
        
        const userImages = (profile.profileImages || []).filter(url => url);
        if (userImages.length > 0) {
            imageCarousel.style.display = 'flex';
            currentImageIndex = 0;
            updateCarouselImage(userImages);
        } else {
            imageCarousel.style.display = 'none';
            carouselImage.src = PLACEHOLDER_IMAGE_PATH;
        }
    }

    function updateCarouselImage(images) {
        if (images.length > 0) {
            carouselImage.src = images[currentImageIndex];
            carouselImage.onerror = function() {
                console.error('Failed to load image:', images[currentImageIndex]);
                carouselImage.src = PLACEHOLDER_IMAGE_PATH;
            };
        } else {
            carouselImage.src = PLACEHOLDER_IMAGE_PATH;
        }
    }

    prevImageButton.addEventListener('click', () => {
        const images = profiles[currentProfileIndex].profileImages || [];
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateCarouselImage(images);
    });

    nextImageButton.addEventListener('click', () => {
        const images = profiles[currentProfileIndex].profileImages || [];
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateCarouselImage(images);
    });

    prevProfileButton.addEventListener('click', () => {
        currentProfileIndex = (currentProfileIndex - 1 + profiles.length) % profiles.length;
        updateProfileDisplay(profiles[currentProfileIndex]);
    });

    nextProfileButton.addEventListener('click', () => {
        currentProfileIndex = (currentProfileIndex + 1) % profiles.length;
        updateProfileDisplay(profiles[currentProfileIndex]);
    });

    matchButton.addEventListener('click', () => {
        chatModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        chatModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == chatModal) {
            chatModal.style.display = 'none';
        }
    });

    sendMessage.addEventListener('click', () => {
        const message = chatMessage.value.trim();
        if (message) {
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            chatWindow.appendChild(messageElement);
            chatMessage.value = '';
        }
    });

    chatMessage.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage.click();
        }
    });
});