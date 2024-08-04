import { initializeFirebase } from '../common/firebaseConfig.js';
import { updateUserProfile, uploadImages, deleteImage } from '../common/auth.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, db, storage } = await initializeFirebase();
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userGender = document.getElementById('userGender');
    const userHobbies = document.getElementById('userHobbies');
    const userAbout = document.getElementById('userAbout');
    const editProfileButton = document.getElementById('editProfileButton');
    const imageCarousel = document.getElementById('imageCarousel');
    const carouselImage = document.getElementById('carouselImage');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    let currentImageIndex = 0;
    let userImages = [];
    const PLACEHOLDER_IMAGE_PATH = '/images/placeholder.png';
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const closeButton = document.querySelector('.close-button');
    const currentImages = document.getElementById('currentImages');
    const editProfileImages = document.getElementById('editProfileImages');
    const cropperContainer = document.getElementById('cropperContainer');
    const cropperImage = document.getElementById('cropperImage');
    const cropButton = document.getElementById('cropButton');

    let cropper;

    editProfileImages.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                cropperImage.src = e.target.result;
                cropperContainer.style.display = 'block';
                if (cropper) {
                    cropper.destroy();
                }
                cropper = new Cropper(cropperImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    minCropBoxWidth: 200,
                    minCropBoxHeight: 200,
                });
            };
            reader.readAsDataURL(file);
        }
    });

    cropButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (cropper) {
            const croppedCanvas = cropper.getCroppedCanvas({
                width: 300,
                height: 300
            });
            croppedCanvas.toBlob(async (blob) => {
                const croppedFile = new File([blob], "cropped_image.jpg", { type: "image/jpeg" });
                try {
                    const newImageUrls = await uploadImages(storage, currentUser.uid, [croppedFile]);
                    userImages = [...userImages, ...newImageUrls].slice(0, 5);
                    updateProfileDisplay({ profileImages: userImages });
                    populateEditForm(); // Refresh the current images display
                    cropperContainer.style.display = 'none';
                    cropper.destroy();
                    cropper = null;
                    editProfileImages.value = ''; // Clear the file input
                } catch (error) {
                    console.error('Error uploading cropped image:', error);
                    alert('An error occurred while uploading the cropped image. Please try again.');
                }
            }, 'image/jpeg');
        }
    });

    let currentUser;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            userProfile.classList.remove('hidden');
            userEmail.textContent = user.email;

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    updateProfileDisplay(userData);
                } else {
                    console.log("No user data found!");
                    updateProfileDisplay({});
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                updateProfileDisplay({});
            }
        } else {
            window.location.href = '/index.html';
        }
    });

    function updateProfileDisplay(userData) {
        userName.textContent = userData.name || 'Not set';
        userGender.textContent = userData.gender || 'Not set';
        userHobbies.textContent = userData.hobbies ? userData.hobbies.join(', ') : 'Not set';
        userAbout.textContent = userData.aboutYou || 'Not set';
        
        userImages = (userData.profileImages || []).filter(url => url);
        if (userImages.length > 0) {
            imageCarousel.style.display = 'flex';
            currentImageIndex = 0;
            updateCarouselImage();
        } else {
            imageCarousel.style.display = 'none';
            carouselImage.src = PLACEHOLDER_IMAGE_PATH;
        }
    }

    function updateCarouselImage() {
        if (userImages.length > 0) {
            carouselImage.src = userImages[currentImageIndex];
            carouselImage.onerror = function() {
                console.error('Failed to load image:', userImages[currentImageIndex]);
                userImages = userImages.filter((_, i) => i !== currentImageIndex);
                if (userImages.length > 0) {
                    currentImageIndex = currentImageIndex % userImages.length;
                    updateCarouselImage();
                    updateFirestoreImages();
                } else {
                    imageCarousel.style.display = 'none';
                    carouselImage.src = PLACEHOLDER_IMAGE_PATH;
                }
            };
        } else {
            imageCarousel.style.display = 'none';
            carouselImage.src = PLACEHOLDER_IMAGE_PATH;
        }
    }

    async function updateFirestoreImages() {
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, { profileImages: userImages });
            console.log('Firestore updated with current images');
        } catch (error) {
            console.error('Error updating Firestore:', error);
        }
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
        populateEditForm();
        editProfileModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == editProfileModal) {
            editProfileModal.style.display = 'none';
        }
    });

    function populateEditForm() {
        try {
            document.getElementById('editName').value = userName.textContent;
            document.getElementById('editGender').value = userGender.textContent;
            document.getElementById('editHobbies').value = userHobbies.textContent;
            document.getElementById('editAboutYou').value = userAbout.textContent;
    
            currentImages.innerHTML = '';
            userImages.forEach((imageUrl, index) => {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = `Profile image ${index + 1}`;
                img.onerror = function() {
                    console.error('Failed to load image:', imageUrl);
                    this.src = PLACEHOLDER_IMAGE_PATH;
                };
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-image';
                deleteButton.textContent = 'X';
                deleteButton.addEventListener('click', async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    await deleteProfileImage(index);
                    populateEditForm();
                });
                
                imageContainer.appendChild(img);
                imageContainer.appendChild(deleteButton);
                currentImages.appendChild(imageContainer);
            });
        } catch (error) {
            console.error('Error populating edit form:', error);
            alert('An error occurred while loading your profile data. Please try again.');
        }
    }    

    async function deleteProfileImage(index) {
        try {
            const imageUrl = userImages[index];
            await deleteImage(storage, currentUser.uid, imageUrl);
            userImages = userImages.filter((_, i) => i !== index);
            
            // Update Firestore document
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, { profileImages: userImages });
            
            updateProfileDisplay({ profileImages: userImages });
            console.log('Image deleted and profile updated');
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image. Please try again.');
        }
    }

    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('editName').value;
        const gender = document.getElementById('editGender').value;
        const hobbies = document.getElementById('editHobbies').value.split(',').map(hobby => hobby.trim());
        const aboutYou = document.getElementById('editAboutYou').value;

        try {
            await updateUserProfile(currentUser, name, gender, hobbies, aboutYou, userImages);
            updateProfileDisplay({ name, gender, hobbies, aboutYou, profileImages: userImages });
            editProfileModal.style.display = 'none';
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating your profile. Please try again.');
        }
    });
});