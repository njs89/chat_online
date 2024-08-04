import { initializeFirebase } from '../common/firebaseConfig.js';
import { getFirestore, collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, arrayUnion } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { initializeMenu } from '../common/menu.js';

let db;
let auth;

document.addEventListener('DOMContentLoaded', async () => {
    initializeMenu();
    const firebaseInit = await initializeFirebase();
    auth = firebaseInit.auth;
    db = firebaseInit.db;
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
                await loadProfiles();
            } catch (error) {
                console.error("Error fetching user profiles:", error);
            }
        } else {
            window.location.href = '/index.html';
        }
    });

    async function loadProfiles() {
        const usersSnapshot = await getDocs(collection(db, "users"));
        profiles = usersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(profile => profile.id !== auth.currentUser.uid);
        
        if (profiles.length > 0) {
            matchProfile.classList.remove('hidden');
            await updateProfileDisplay(profiles[currentProfileIndex]);
        } else {
            matchProfile.classList.add('hidden');
            alert('No matching profiles found.');
        }
    }

    async function updateProfileDisplay(profile) {
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
        const isMatched = await checkIfMatched(profile.id);
        updateMatchButton(isMatched);
    }       

    function updateMatchButton(isMatched) {
        matchButton.textContent = isMatched ? 'Unmatch' : 'Match';
        matchButton.onclick = () => handleMatchAction(profiles[currentProfileIndex].id, isMatched);
    }

    async function handleMatchAction(partnerId, isMatched) {
        if (isMatched) {
            await unmatch(partnerId);
        } else {
            await saveMatch(partnerId);
        }
        await updateProfileDisplay(profiles[currentProfileIndex]);
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
        const currentProfile = profiles[currentProfileIndex];
        saveMatch(currentProfile.id);
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

async function checkIfMatched(partnerId) {
    const matchesRef = collection(db, 'matches');
    const q = query(
        matchesRef,
        where('userId', '==', auth.currentUser.uid),
        where('partnerId', '==', partnerId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

async function saveMatch(partnerId) {
    if (!db || !auth.currentUser) {
        console.error('Database or user not initialized');
        return;
    }

    try {
        const matchesRef = collection(db, 'matches');
        
        // Check if a match already exists
        const matchQuery = query(
            matchesRef,
            where('users', 'array-contains', auth.currentUser.uid)
        );
        const matchSnapshot = await getDocs(matchQuery);

        let matchDoc = matchSnapshot.docs.find(doc => 
            doc.data().users.includes(partnerId)
        );

        if (matchDoc) {
            // Match document already exists
            const matchData = matchDoc.data();
            if (!matchData.matchedBy.includes(auth.currentUser.uid)) {
                // Current user hasn't matched yet, so update the document
                await updateDoc(doc(db, 'matches', matchDoc.id), {
                    matchedBy: arrayUnion(auth.currentUser.uid)
                });
                
                if (matchData.matchedBy.includes(partnerId)) {
                    alert('You have a new match!');
                } else {
                    alert('Match request sent!');
                }
            } else {
                alert('You already matched with this user!');
            }
        } else {
            // No match document exists, so create a new one
            await addDoc(matchesRef, {
                users: [auth.currentUser.uid, partnerId],
                matchedBy: [auth.currentUser.uid],
                timestamp: new Date()
            });
            alert('Match request sent!');
        }
    } catch (error) {
        console.error('Error saving match:', error);
    }
}

async function checkForMutualMatch(partnerId) {
    if (!db || !auth.currentUser) {
        console.error('Database or user not initialized');
        return false;
    }

    const matchesRef = collection(db, 'matches');
    const q = query(
        matchesRef,
        where('users', 'array-contains', auth.currentUser.uid),
        where('users', 'array-contains', partnerId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const matchDoc = querySnapshot.docs[0];
        const matchData = matchDoc.data();
        return matchData.matchedBy.includes(auth.currentUser.uid) && matchData.matchedBy.includes(partnerId);
    }

    return false;
}

async function unmatch(partnerId) {
    if (!db || !auth.currentUser) {
        console.error('Database or user not initialized');
        return;
    }

    try {
        const matchesRef = collection(db, 'matches');
        const q = query(
            matchesRef,
            where('users', 'array-contains', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        const matchToDelete = querySnapshot.docs.find(doc => doc.data().users.includes(partnerId));
        if (matchToDelete) {
            await deleteDoc(doc(db, 'matches', matchToDelete.id));
            console.log('Unmatched successfully');
        }
    } catch (error) {
        console.error('Error unmatching:', error);
    }
}

async function cleanupDuplicateMatches() {
    const matchesRef = collection(db, 'matches');
    const matchesSnapshot = await getDocs(matchesRef);
    
    const matchMap = new Map();
    
    matchesSnapshot.forEach(doc => {
        const data = doc.data();
        const key = data.users.sort().join('_');
        if (!matchMap.has(key) || doc.data().timestamp > matchMap.get(key).data().timestamp) {
            matchMap.set(key, doc);
        }
    });
    
    const batch = writeBatch(db);
    matchesSnapshot.forEach(doc => {
        const key = doc.data().users.sort().join('_');
        if (matchMap.get(key).id !== doc.id) {
            batch.delete(doc.ref);
        }
    });
    
    await batch.commit();
    console.log('Duplicate matches cleaned up');
}