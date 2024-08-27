import { initializeFirebase } from '../common/firebaseConfig.js';
import { updateUserProfile, uploadImages, deleteImage } from '../common/auth.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getDownloadURL, ref, deleteObject } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';
import { initializeMenu } from '../common/menu.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeMenu();
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
    let startX;
    let isSwiping = false;
    // Function to check if the device is mobile
    function isMobileDevice() {
        return (window.innerWidth <= 768) && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
    // Function to add swipe functionality
    function addSwipeFunctionality() {
        if (!isMobileDevice()) return;

        imageCarousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
        });

        imageCarousel.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            
            const currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            
            if (Math.abs(diff) > 50) { // Threshold for swipe
                if (diff > 0) {
                    // Swipe left
                    currentImageIndex = (currentImageIndex + 1) % userImages.length;
                } else {
                    // Swipe right
                    currentImageIndex = (currentImageIndex - 1 + userImages.length) % userImages.length;
                }
                updateCarouselImage();
                isSwiping = false;
            }
        });

        imageCarousel.addEventListener('touchend', () => {
            isSwiping = false;
        });
    }

    // Add swipe functionality initially if it's a mobile device
    addSwipeFunctionality();

    // Re-check and add/remove swipe functionality on window resize
    window.addEventListener('resize', () => {
        if (isMobileDevice()) {
            addSwipeFunctionality();
        } else {
            // Remove touch event listeners if it's not a mobile device
            imageCarousel.removeEventListener('touchstart', null);
            imageCarousel.removeEventListener('touchmove', null);
            imageCarousel.removeEventListener('touchend', null);
        }
    });



    // Enable/disable fields when "Change" button is clicked
    document.querySelectorAll('.change-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const fieldId = event.target.dataset.field;
            const field = document.getElementById(fieldId);
            field.disabled = !field.disabled;
            event.target.textContent = field.disabled ? 'Change' : 'Cancel';
        });
    });

    // Prevent modal from closing when clicking outside
    editProfileModal.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            event.stopPropagation();
        }
    });

    // Close modal only when close button is clicked
    closeButton.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

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
                width: 600,
                height: 600
            });
            croppedCanvas.toBlob(async (blob) => {
                const croppedFile = new File([blob], `profile_image_${Date.now()}.jpg`, { type: "image/jpeg" });
                try {
                    const newImageUrls = await uploadImages(storage, currentUser.uid, [croppedFile]);
                    if (newImageUrls.length > 0) {
                        userImages = [...userImages, ...newImageUrls].slice(0, 5);
                        await updateFirestoreImages();
                        updateProfileImagesDisplay(userImages);
                    }
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
        
        updateProfileImagesDisplay(userData.profileImages || []);
    }

    async function updateCarouselImage() {
        if (userImages.length > 0) {
            const imageUrl = userImages[currentImageIndex];
            try {
                // Try to get a fresh download URL
                const storageRef = ref(storage, imageUrl);
                const freshUrl = await getDownloadURL(storageRef);
                carouselImage.src = freshUrl;
                userImages[currentImageIndex] = freshUrl; // Update the URL in the array
            } catch (error) {
                console.error('Error loading image:', error);
                // Remove the invalid image URL
                userImages = userImages.filter((_, i) => i !== currentImageIndex);
                if (userImages.length > 0) {
                    currentImageIndex = currentImageIndex % userImages.length;
                    await updateCarouselImage();
                } else {
                    imageCarousel.style.display = 'none';
                    carouselImage.src = PLACEHOLDER_IMAGE_PATH;
                }
                // Update Firestore with the new userImages array
                await updateFirestoreImages();
            }
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
            throw error; // Rethrow the error to be caught by the calling function
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
            document.getElementById('editName').value = userName.textContent !== 'Not set' ? userName.textContent : '';
            document.getElementById('editGender').value = userGender.textContent !== 'Not set' ? userGender.textContent : '';
            document.getElementById('editHobbies').value = userHobbies.textContent !== 'Not set' ? userHobbies.textContent : '';
            document.getElementById('editAboutYou').value = userAbout.textContent !== 'Not set' ? userAbout.textContent : '';
    
            // Reset all fields to disabled state
            document.querySelectorAll('.edit-field input, .edit-field select, .edit-field textarea').forEach(field => {
                field.disabled = true;
            });
            document.querySelectorAll('.change-button').forEach(button => {
                button.textContent = 'Change';
            });
    
            populateEditFormImages();
        } catch (error) {
            console.error('Error populating edit form:', error);
            alert('An error occurred while loading your profile data. Please try again.');
        }
    }


    async function populateEditFormImages() {
        currentImages.innerHTML = '';
        const validImages = [];
        for (const [index, imageUrl] of userImages.entries()) {
            try {
                const storageRef = ref(storage, imageUrl);
                const freshUrl = await getDownloadURL(storageRef);
                validImages.push(freshUrl);
                
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                
                const img = document.createElement('img');
                img.src = freshUrl;
                img.alt = `Profile image ${index + 1}`;
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-image';
                deleteButton.textContent = 'X';
                deleteButton.addEventListener('click', async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    await deleteProfileImage(validImages.indexOf(freshUrl));
                });
                
                imageContainer.appendChild(img);
                imageContainer.appendChild(deleteButton);
                currentImages.appendChild(imageContainer);
            } catch (error) {
                console.error('Error loading image:', error);
                // Skip this image as it's invalid
            }
        }
        
        // Update userImages with only valid images
        if (userImages.length !== validImages.length) {
            userImages = validImages;
            await updateFirestoreImages();
        }
    }


    async function deleteProfileImage(index) {
        try {
            const imageUrl = userImages[index];
            const storageRef = ref(storage, imageUrl);
            
            // Attempt to delete the image from storage
            try {
                await deleteObject(storageRef);
                console.log('Image deleted from storage');
            } catch (storageError) {
                if (storageError.code !== 'storage/object-not-found') {
                    throw storageError; // Rethrow if it's not a 'not found' error
                }
                console.log('Image not found in storage, proceeding with removal from profile');
            }
    
            // Remove the image URL from the userImages array
            userImages = userImages.filter((_, i) => i !== index);
            
            // Update Firestore document with the updated images
            await updateFirestoreImages();
            
            // Update the profile display
            await updateProfileImagesDisplay(userImages);
            console.log('Image deleted and profile updated');
        } catch (error) {
            console.error('Error in deleteProfileImage:', error);
            alert('An error occurred while deleting the image. Please try again.');
        }
    }

    async function updateProfileImagesDisplay(images) {
        userImages = images.filter(url => url);
        if (userImages.length > 0) {
            imageCarousel.style.display = 'flex';
            currentImageIndex = 0;
            await updateCarouselImage();
        } else {
            imageCarousel.style.display = 'none';
            carouselImage.src = PLACEHOLDER_IMAGE_PATH;
        }
        
        // Update the edit form images display
        await populateEditFormImages();
    }

    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('editName').value || userName.textContent;
        const gender = document.getElementById('editGender').value || userGender.textContent;
        const hobbies = document.getElementById('editHobbies').value ? document.getElementById('editHobbies').value.split(',').map(hobby => hobby.trim()) : userHobbies.textContent.split(',').map(hobby => hobby.trim());
        const aboutYou = document.getElementById('editAboutYou').value || userAbout.textContent;

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
