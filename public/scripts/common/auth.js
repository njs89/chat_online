import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, GoogleAuthProvider, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { deleteObject, getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

export async function register(auth, email, password) {
    try {
        return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please use a different email or try logging in.');
        } else {
            console.error('Registration Error:', error.code, error.message);
            throw new Error('Registration failed. Please try again later.');
        }
    }
}
export async function checkIfEmailExists(auth, email) {
    try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        return signInMethods.length > 0;
    } catch (error) {
        console.error("Error checking email existence:", error);
        return false;
    }
}

export function login(auth, email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            console.error('Login Error:', error.code, error.message);
        });
}

export async function registerWithGoogle(auth, googleProvider) {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        // Instead of throwing an error, return an object with user info and a flag
        const userExists = await checkIfEmailExists(auth, result.user.email);
        return {
            user: result.user,
            isExistingUser: userExists
        };
    } catch (error) {
        console.error('Google Authentication Error:', error.code, error.message);
        throw error;
    }
}

export function logout(auth) {
    return signOut(auth)
        .then(() => {
            console.log('User successfully logged out');
        })
        .catch(error => {
            console.error('Logout Error:', error.code, error.message);
        });
}

export async function updateUserProfile(user, name, gender, hobbies, aboutYou, imageUrls) {
    const db = getFirestore();
    
    await updateProfile(user, { displayName: name });
    
    await setDoc(doc(db, "users", user.uid), {
        name: name,
        gender: gender,
        hobbies: hobbies,
        aboutYou: aboutYou,
        profileImages: imageUrls
    });
}

export async function uploadImages(storage, userId, imageFiles) {
    const imageUrls = [];
    for (let i = 0; i < Math.min(imageFiles.length, 5); i++) {
        const file = imageFiles[i];
        try {
            const resizedFile = await resizeImageIfNeeded(file, 600, 600);
            const storageRef = ref(storage, `user_images/${userId}/${resizedFile.name}`);
            await uploadBytes(storageRef, resizedFile);
            const url = await getDownloadURL(storageRef);
            imageUrls.push(url);
        } catch (error) {
            console.error('Error uploading image:', error);
            if (error.code === 'storage/canceled') {
                alert('Image upload was canceled. Please try again.');
            } else {
                alert('Failed to upload image. Please check your internet connection and try again.');
            }
            // Don't continue with the next image if there's an error
            break;
        }
    }
    return imageUrls;
}


async function resizeImageIfNeeded(file, targetWidth, targetHeight) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            if (img.width >= targetWidth && img.height >= targetHeight) {
                resolve(file);
            } else {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg');
            }
        };
        img.src = URL.createObjectURL(file);
    });
}

export async function deleteImage(storage, userId, imageUrl) {
    try {
        const url = new URL(imageUrl);
        const imagePath = decodeURIComponent(url.pathname.split('/o/')[1]).split('?')[0];
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
        console.log('File deleted successfully from Storage');
    } catch (error) {
        console.error('Error deleting image from Storage:', error);
        throw error;
    }
}
