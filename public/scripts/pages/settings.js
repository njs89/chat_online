import { initializeFirebase } from '../common/firebaseConfig.js';
import { logout } from '../common/auth.js';
import { initializeMenu } from '../common/menu.js';
import { getFirestore, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getStorage, ref, listAll, deleteObject } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeMenu();
    const { auth, db, storage } = await initializeFirebase();
    const logoutButton = document.getElementById('logoutButton');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmDeleteButton = document.getElementById('confirmDelete');
    const cancelDeleteButton = document.getElementById('cancelDelete');

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = '/index.html';
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await logout(auth);
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    });

    deleteAccountButton.addEventListener('click', () => {
        confirmationModal.style.display = 'block';
    });

    cancelDeleteButton.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });

    confirmDeleteButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                await deleteUserData(user.uid);
                await user.delete();
                alert('Your account has been deleted. You will be logged out now.');
                window.location.href = '/index.html';
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('An error occurred while deleting your account. Please try again.');
            }
        }
    });

    async function deleteUserData(userId) {
        try {
            console.log('Starting user data deletion for user:', userId);

            // Delete user document from Firestore
            console.log('Deleting user document from Firestore...');
            await deleteDoc(doc(db, "users", userId));
            console.log('User document deleted successfully');

            // Delete user images from Storage
            console.log('Deleting user images from Storage...');
            const storageRef = ref(storage, `user_images/${userId}`);
            const fileList = await listAll(storageRef);
            console.log('Files to delete:', fileList.items.length);

            const deletePromises = fileList.items.map(async (fileRef) => {
                try {
                    await deleteObject(fileRef);
                    console.log('Deleted file:', fileRef.fullPath);
                } catch (error) {
                    console.error('Error deleting file:', fileRef.fullPath, error);
                }
            });

            await Promise.all(deletePromises);
            console.log('All user images deleted successfully');

            console.log('User data deletion completed successfully');
        } catch (error) {
            console.error('Error deleting user data:', error);
            throw error; // Rethrow the error so it can be caught in the calling function
        }
    }
});