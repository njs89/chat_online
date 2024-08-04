import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { deleteObject, getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';



export function register(auth, email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
        .catch(error => {
            console.error('Registration Error:', error.code, error.message);
        });
}

export function login(auth, email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            console.error('Login Error:', error.code, error.message);
        });
}

export function registerWithGoogle(auth, googleProvider) {
    return signInWithPopup(auth, googleProvider)
        .catch(error => {
            console.error('Google Registration Error:', error.code, error.message);
        });
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
            // Resize image if it's smaller than 300x300
            const resizedFile = await resizeImageIfNeeded(file, 300, 300);
            const storageRef = ref(storage, `user_images/${userId}/${resizedFile.name}`);
            await uploadBytes(storageRef, resizedFile);
            const url = await getDownloadURL(storageRef);
            imageUrls.push(url);
        } catch (error) {
            console.error('Error uploading image:', error);
            // Continue with the next image
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