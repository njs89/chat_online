import { initializeFirebase } from '../common/firebaseConfig.js';
import { register, registerWithGoogle, updateUserProfile, uploadImages } from '../common/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { auth, googleProvider, storage } = await initializeFirebase();
    const registerForm = document.getElementById('registerForm');
    const googleRegisterButton = document.getElementById('googleRegisterButton');
    const confirmationPopup = document.getElementById('confirmationPopup');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    let pendingCredential;

    // Step navigation
    const steps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    let currentStep = 0;

    // Image cropping
    const profileImagesInput = document.getElementById('profileImages');
    const cropperContainer = document.getElementById('cropperContainer');
    const cropperImage = document.getElementById('cropperImage');
    const cropButton = document.getElementById('cropButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    let cropper;
    let croppedImages = [];

    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    showStep(currentStep);

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

    profileImagesInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                validateImageFile(file);
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
            } catch (error) {
                alert(error.message);
                profileImagesInput.value = '';
            }
        }
    });

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
                profileImagesInput.value = '';
                cropper.destroy();
                cropper = null;
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
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('name').value;
            const gender = document.getElementById('gender').value;
            const hobbies = document.getElementById('hobbies').value.split(',').map(hobby => hobby.trim());
            const aboutYou = document.getElementById('aboutYou').value;
        
            try {
                const userCredential = await register(auth, email, password);
                const imageUrls = await uploadImages(storage, userCredential.user.uid, croppedImages);
                await updateUserProfile(userCredential.user, name, gender, hobbies, aboutYou, imageUrls);
                console.log('User registered and profile updated successfully');
                window.location.href = '/mainpage.html';
            } catch (error) {
                console.error('Registration failed:', error.message);
                alert('Registration failed: ' + error.message);
            }
        });
    }

    if (googleRegisterButton) {
        googleRegisterButton.addEventListener('click', async () => {
            await registerWithGoogle(auth, googleProvider)
                .then(credential => {
                    pendingCredential = credential;
                    confirmationMessage.textContent = `You are registering as ${credential.user.email}. Do you want to continue?`;
                    confirmationPopup.classList.remove('hidden');
                })
                .catch(error => {
                    console.error('Google Registration Failed:', error.message);
                });
        });
    }

    confirmButton.addEventListener('click', () => {
        confirmationPopup.classList.add('hidden');
        console.log(`User ${pendingCredential.user.email} confirmed registration`);
        window.location.href = '/mainpage.html';
    });

    cancelButton.addEventListener('click', () => {
        confirmationPopup.classList.add('hidden');
        console.log('User cancelled the registration');
        auth.signOut().then(() => {
            console.log('Cancelled user signed out');
        });
        pendingCredential = null;
    });
});