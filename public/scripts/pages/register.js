import { initializeFirebase } from '../common/firebaseConfig.js';
import { register, updateUserProfile, uploadImages, checkIfEmailExists } from '../common/auth.js';
import { GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';


document.addEventListener('DOMContentLoaded', async () => {
    const { auth, storage } = await initializeFirebase();
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

    function gatherUserInput() {
        return {
            name: document.getElementById('name').value,
            gender: document.getElementById('gender').value,
            hobbies: document.getElementById('hobbies').value.split(',').map(hobby => hobby.trim()),
            aboutYou: document.getElementById('aboutYou').value,
            croppedImages: croppedImages
        };
    }

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
        console.log('Image selected'); // Add this line        
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
                    cropButton.style.display = 'block'; // Make sure the crop button is visible
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
                cropButton.style.display = 'none'; // Hide the crop button after cropping
                profileImagesInput.value = ''; // Clear the input
                cropper.destroy();
                cropper = null;
                
                // Re-enable file selection
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
        
        // Disable the file input if max images are reached
        profileImagesInput.disabled = croppedImages.length >= 5;
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const userInput = gatherUserInput();
        
            try {
                const emailExists = await checkIfEmailExists(auth, email);
                if (emailExists) {
                    throw new Error('This email is already registered. Please use a different email or try logging in.');
                }
                const userCredential = await register(auth, email, password);
                const imageUrls = await uploadImages(storage, userCredential.user.uid, userInput.croppedImages);
                await updateUserProfile(userCredential.user, userInput.name, userInput.gender, userInput.hobbies, userInput.aboutYou, imageUrls);
                console.log('User registered and profile updated successfully');
                window.location.href = '/mainpage.html';
            } catch (error) {
                console.log('Registration could not be completed:', error.message);
                alert(error.message);
            }
        });
    }
    
    if (googleRegisterButton) {
        googleRegisterButton.addEventListener('click', handleGoogleAuth);
    }
    
    async function handleGoogleAuth() {
        try {
            console.log("Starting Google Authentication");
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            console.log("Google Authentication successful", user);
    
            const isNewUser = await checkIfNewUser(user);
            console.log("Is new user?", isNewUser);
    
            if (isNewUser) {
                console.log("Proceeding with new user registration");
                const userInput = gatherUserInput();
                confirmationMessage.textContent = `You are registering as ${user.email}. Do you want to continue?`;
                confirmationPopup.classList.remove('hidden');
    
                confirmButton.onclick = async () => {
                    confirmationPopup.classList.add('hidden');
                    try {
                        const imageUrls = await uploadImages(storage, user.uid, userInput.croppedImages);
                        await updateUserProfile(user, userInput.name, userInput.gender, userInput.hobbies, userInput.aboutYou, imageUrls);
                        await markUserAsRegistered(user.uid);
                        console.log(`User ${user.email} registered successfully`);
                        window.location.href = '/mainpage.html';
                    } catch (error) {
                        console.error('Error updating profile:', error);
                        alert('Failed to complete registration. Please try again.');
                        await auth.signOut();
                    }
                };
    
                cancelButton.onclick = async () => {
                    confirmationPopup.classList.add('hidden');
                    console.log('User cancelled the registration');
                    await auth.signOut();
                };
            } else {
                console.log("Handling existing user");
                confirmationMessage.textContent = `Welcome back! You're already registered with ${user.email}. Do you want to log in?`;
                confirmationPopup.classList.remove('hidden');
    
                confirmButton.onclick = () => {
                    confirmationPopup.classList.add('hidden');
                    console.log(`User ${user.email} logged in`);
                    window.location.href = '/mainpage.html';
                };
    
                cancelButton.onclick = async () => {
                    confirmationPopup.classList.add('hidden');
                    console.log('User cancelled the login');
                    await auth.signOut();
                };
            }
        } catch (error) {
            console.error('Google Authentication Error:', error);
            console.error('Error details:', error.code, error.message);
            alert('Google Authentication Failed: ' + error.message);
        }
    }
    
    async function checkIfNewUser(user) {
        console.log("Checking if user is new:", user.uid);
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        
        try {
            const userDoc = await getDoc(userRef);
            console.log("User document exists:", userDoc.exists());
            
            if (!userDoc.exists()) {
                console.log("User document doesn't exist, treating as new user");
                return true;
            }
            
            const userData = userDoc.data();
            console.log("User data:", userData);
            
            if (userData.isRegistered === undefined) {
                console.log("isRegistered field doesn't exist, treating as new user");
                return true;
            }
            
            console.log("isRegistered value:", userData.isRegistered);
            return !userData.isRegistered;
        } catch (error) {
            console.error("Error checking if user is new:", error);
            // If there's an error, we'll treat the user as new to be safe
            return true;
        }
    }

    async function markUserAsRegistered(userId) {
        console.log("Marking user as registered:", userId);
        const db = getFirestore();
        const userRef = doc(db, "users", userId);
        try {   
            await setDoc(userRef, { isRegistered: true }, { merge: true });
            console.log("User marked as registered successfully");
        } catch (error) {
            console.error("Error marking user as registered:", error);
            throw error;
        }
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