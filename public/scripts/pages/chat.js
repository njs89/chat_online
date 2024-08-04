import { initializeFirebase } from '../common/firebaseConfig.js';
import { getFirestore, collection, query, where, onSnapshot, addDoc, orderBy, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { initializeMenu } from '../common/menu.js';

let db;
let auth;
let currentChatPartner = null;
let currentChatPartnerName = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');
    initializeMenu();
    const firebaseInit = await initializeFirebase();
    auth = firebaseInit.auth;
    db = firebaseInit.db;

    const matchList = document.getElementById('matchList');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatHeader = document.getElementById('chatHeader');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('User authenticated');
            loadMatches();
        } else {
            console.log('User not authenticated, redirecting');
            window.location.href = '/index.html';
        }
    });

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });    

    function loadMatches() {
        console.log('Loading matches');
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('users', 'array-contains', auth.currentUser.uid));

        onSnapshot(q, async (snapshot) => {
            matchList.innerHTML = '';
            for (const doc of snapshot.docs) {
                const match = doc.data();
                if (match.matchedBy.includes(auth.currentUser.uid) && match.matchedBy.length > 1) {
                    const partnerId = match.users.find(id => id !== auth.currentUser.uid);
                    const partnerName = await getUserName(partnerId);
                    const listItem = document.createElement('li');
                    listItem.textContent = partnerName;
                    listItem.dataset.partnerId = partnerId;
                    listItem.onclick = () => loadChat(partnerId, partnerName, listItem);
                    matchList.appendChild(listItem);
                }
            }
            console.log('Matches loaded');
        });
    }

    async function getUserName(userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        return userDocSnap.exists() ? userDocSnap.data().name : 'Unknown User';
    }


    function loadChat(partnerId, partnerName, listItem) {
        console.log('Loading chat for partner:', partnerName);
        
        // Remove active class from previously selected match
        const activeMatch = matchList.querySelector('.active');
        if (activeMatch) {
            activeMatch.classList.remove('active');
        }
    
        // Add active class to selected match
        listItem.classList.add('active');
    
        currentChatPartner = partnerId;
        currentChatPartnerName = partnerName;
        chatHeader.textContent = `Chat with ${partnerName}`;
        chatMessages.innerHTML = '<p>Loading messages...</p>';
        
        // Enable input and send button
        messageInput.disabled = false;
        sendButton.disabled = false;
    
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('users', 'array-contains', auth.currentUser.uid),
            orderBy('timestamp')
        );
    
        onSnapshot(q, (snapshot) => {
            chatMessages.innerHTML = '';
            snapshot.docs.forEach((doc) => {
                const message = doc.data();
                if (message.users.includes(partnerId)) {
                    displayMessage(message);
                }
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, (error) => {
            console.error("Error loading chat:", error);
            chatMessages.innerHTML = '<p>Error loading messages. Please try again later.</p>';
        });
    }

    function displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        const isCurrentUser = message.sender === auth.currentUser.uid;
        messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
        
        const senderName = isCurrentUser ? 'You' : currentChatPartnerName;
        messageElement.innerHTML = `
            <strong>${senderName}:</strong>
            <span>${message.text}</span>
        `;
        
        chatMessages.appendChild(messageElement);
    }

    async function sendMessage() {
        console.log('Attempting to send message');
        const messageText = messageInput.value.trim();
        if (!messageText || !currentChatPartner) {
            console.log('Cannot send message: ', messageText ? 'No chat partner selected' : 'Empty message');
            return;
        }
        if (messageText && currentChatPartner) {
            try {
                await addDoc(collection(db, 'messages'), {
                    text: messageText,
                    sender: auth.currentUser.uid,
                    recipient: currentChatPartner,
                    users: [auth.currentUser.uid, currentChatPartner],
                    timestamp: new Date()
                });
                console.log('Message sent successfully');
                messageInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try again.');
            }
        } else {
            console.log('Cannot send message: ', messageText ? 'No chat partner selected' : 'Empty message');
        }
    }

});