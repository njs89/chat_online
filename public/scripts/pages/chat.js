import { initializeFirebase } from '../common/firebaseConfig.js';
import { initializeMenu } from '../common/menu.js';
import { getFirestore, collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeMenu();
    const { auth, db } = await initializeFirebase();
    const matchList = document.getElementById('matchList');
    const chatHeader = document.getElementById('chatHeader');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    let currentUser;
    let currentChatPartner;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            loadMatches();
        } else {
            window.location.href = '/index.html';
        }
    });

    function loadMatches() {
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('users', 'array-contains', currentUser.uid));

        onSnapshot(q, (snapshot) => {
            matchList.innerHTML = '';
            snapshot.forEach((doc) => {
                const match = doc.data();
                const partnerId = match.users.find(id => id !== currentUser.uid);
                const listItem = document.createElement('li');
                listItem.textContent = partnerId; // Replace with actual user name when available
                listItem.addEventListener('click', () => loadChat(partnerId));

                const unmatchButton = document.createElement('button');
                unmatchButton.textContent = 'Unmatch';
                unmatchButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    unmatch(doc.id);
                });

                listItem.appendChild(unmatchButton);
                matchList.appendChild(listItem);
            });
        });
    }

    function loadChat(partnerId) {
        currentChatPartner = partnerId;
        chatHeader.textContent = `Chat with ${partnerId}`; // Replace with actual user name when available
        chatMessages.innerHTML = '';

        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('users', 'in', [[currentUser.uid, partnerId], [partnerId, currentUser.uid]]),
            orderBy('timestamp')
        );

        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    displayMessage(message);
                }
            });
        });
    }

    function displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(message.sender === currentUser.uid ? 'sent' : 'received');
        messageElement.textContent = message.text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText && currentChatPartner) {
            try {
                await addDoc(collection(db, 'messages'), {
                    text: messageText,
                    sender: currentUser.uid,
                    recipient: currentChatPartner,
                    users: [currentUser.uid, currentChatPartner],
                    timestamp: new Date()
                });
                messageInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    async function unmatch(matchId) {
        try {
            await deleteDoc(doc(db, 'matches', matchId));
            // You might want to delete or archive the chat messages here as well
        } catch (error) {
            console.error('Error unmatching:', error);
        }
    }
});