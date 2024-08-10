import { initializeFirebase } from '../common/firebaseConfig.js';
import { updateUserProfile, uploadImages } from '../common/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, storage } = await initializeFirebase();
    const profileForm = document.getElementById('profileForm');
    const profileImagesInput = document.getElementById('profileImages');
    const cropperContainer = document.getElementById('cropperContainer');
    const cropperImage = document.getElementById('cropperImage');
    const cropButton = document.getElementById('cropButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    let cropper;
    let croppedImages = [];

    function gatherUserInput() {
        return {
            name: document.getElementById('name').value,
            gender: document.getElementById('gender').value,
            hobbies: document.getElementById('hobbies').value.split(',').map(hobby => hobby.trim()),
            aboutYou: document.getElementById('aboutYou').value,
            croppedImages: croppedImages
        };
    }

    function validateImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('File is too large. Please upload an image smaller than 5MB.');
        }
    }

    function initializeCropper() {
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(cropperImage, {
            aspectRatio: 1,
            viewMode: 1,
            minCropBoxWidth: 200,
            minCropBoxHeight: 200,
            maxWidth: 600,
            maxHeight: 600,
            responsive: true,
            restore: false,
        });
    }
    
    function handleImageSelection(event) {
        if (croppedImages.length >= 5) {
            alert('You can only upload a maximum of 5 images.');
            event.target.value = '';
            return;
        }
    
        const file = event.target.files[0];
        if (file) {
            try {
                validateImageFile(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    cropperImage.src = e.target.result;
                    cropperContainer.style.display = 'block';
                    cropButton.style.display = 'block';
                    initializeCropper();
                };
                reader.readAsDataURL(file);
            } catch (error) {
                alert(error.message);
                profileImagesInput.value = '';
            }
        }
    }

    profileImagesInput.addEventListener('change', handleImageSelection);

    cropButton.addEventListener('click', () => {
        if (cropper) {
            const croppedCanvas = cropper.getCroppedCanvas({
                width: 600,
                height: 600
            });
            croppedCanvas.toBlob((blob) => {
                const croppedFile = new File([blob], `profile_image_${Date.now()}.jpg`, { type: "image/jpeg" });
                croppedImages.push(croppedFile);
                updateImagePreview();
                cropperContainer.style.display = 'none';
                cropButton.style.display = 'none';
                profileImagesInput.value = '';
                cropper.destroy();
                cropper = null;
                profileImagesInput.disabled = false;
            }, 'image/jpeg');
        }
    });

    function updateImagePreview() {
        imagePreviewContainer.innerHTML = '';
        croppedImages.forEach((file, index) => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.margin = '5px';

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.onclick = (e) => {
                e.preventDefault();
                croppedImages.splice(index, 1);
                updateImagePreview();
            };

            const container = document.createElement('div');
            container.appendChild(img);
            container.appendChild(removeButton);
            imagePreviewContainer.appendChild(container);
        });
        
        profileImagesInput.disabled = croppedImages.length >= 5;
    }

    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to create a profile.');
            window.location.href = '/login.html';
            return;
        }

        const userInput = gatherUserInput();
        try {
            const imageUrls = await uploadImages(storage, user.uid, userInput.croppedImages);
            await updateUserProfile(user, userInput.name, userInput.gender, userInput.hobbies, userInput.aboutYou, imageUrls);
            console.log('User profile updated successfully');
            window.location.href = '/mainpage.html';
        } catch (error) {
            console.log('Profile update could not be completed:', error.message);
            alert(error.message);
        }
    });
});