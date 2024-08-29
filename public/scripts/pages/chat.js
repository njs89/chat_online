import { initializeFirebase } from '../common/firebaseConfig.js';
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { initializeMenu } from '../common/menu.js';
import { ensureAuthenticated } from '../common/auth.js';

let db;
let auth;
let currentChatId = null;
let currentChatPartnerName = null;
let lastDisplayedMessageTimestamp = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');
    initializeMenu();
    const firebaseInit = await initializeFirebase();
    auth = firebaseInit.auth;
    db = firebaseInit.db;

    const chatContainer = document.querySelector('.chat-container');
    const matchList = document.getElementById('matchList');
    const chatWindow = document.querySelector('.chat-window');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatHeader = document.getElementById('chatHeader');
    const backButton = document.querySelector('.back-button');

    hideHeaderIfMobile();
    window.addEventListener('resize', hideHeaderIfMobile);

    function isMobile() {
        return window.innerWidth < 769;
    }

    function hideHeaderIfMobile() {
        const header = document.querySelector('.header');
        if (isMobile() && header) {
            header.style.display = 'none';
        }
    }

    function hideChatOnMobile() {
        document.querySelector('.chat-container').classList.remove('show-chat');
        backButton.style.display = 'none';
    }
       
    backButton.addEventListener('click', () => {
        hideChatOnMobile();
    });

    try {
        const user = await ensureAuthenticated(auth);
        console.log('User is authenticated:', user.uid);
        if (!isMobile()) {
            loadMatches();
        } else {
            prepareMatchList();
        }
    } catch (error) {
        console.error('Authentication error:', error);
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function prepareMatchList() {
        console.log('Preparing match list for mobile');
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('users', 'array-contains', auth.currentUser.uid));
    
        onSnapshot(q, async (snapshot) => {
            matchList.innerHTML = '';
            for (const doc of snapshot.docs) {
                const match = doc.data();
                if (match.matchedBy && match.matchedBy.includes(auth.currentUser.uid) && match.matchedBy.length > 1) {
                    const partnerId = match.users.find(id => id !== auth.currentUser.uid);
                    const partnerName = await getUserName(partnerId);
                    const listItem = document.createElement('li');
                    listItem.textContent = partnerName;
                    listItem.dataset.partnerId = partnerId;
                    listItem.onclick = () => {
                        document.querySelector('.chat-container').classList.add('show-chat');
                        loadOrCreateChat(partnerId, partnerName, listItem);
                    };
                    matchList.appendChild(listItem);
                }
            }
            console.log('Match list prepared');
        });
    }

    async function loadMatches() {
        console.log('Loading matches');
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('users', 'array-contains', auth.currentUser.uid));
        onSnapshot(q, async (snapshot) => {
            matchList.innerHTML = '';
            for (const doc of snapshot.docs) {
                const match = doc.data();
                if (match.matchedBy && match.matchedBy.includes(auth.currentUser.uid) && match.matchedBy.length > 1) {
                    const partnerId = match.users.find(id => id !== auth.currentUser.uid);
                    const partnerName = await getUserName(partnerId);
                    const listItem = document.createElement('li');
                    listItem.textContent = partnerName;
                    listItem.dataset.partnerId = partnerId;
                    listItem.onclick = () => {
                        if (isMobile()) {
                            updateMobileChatIndicator(partnerName);
                        }
                        loadOrCreateChat(partnerId, partnerName, listItem);
                    };
                    matchList.appendChild(listItem);
                }
            }
            console.log('Matches loaded');
        });
    }

    function updateMobileChatIndicator(partnerName) {
        const indicator = document.querySelector('#mobileChatIndicator');
        indicator.textContent = `Chat loaded for ${partnerName}. Tap here to view.`;
        indicator.style.display = 'block';
        indicator.onclick = () => {
            document.querySelector('.chat-container').classList.add('show-chat');
        };
    }

    async function getUserName(userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        return userDocSnap.exists() ? userDocSnap.data().name : 'Unknown User';
    }

    async function loadOrCreateChat(partnerId, partnerName, listItem) {
        console.log('Loading or creating chat for partner:', partnerName);
        const activeMatch = matchList.querySelector('.active');
        if (activeMatch) {
            activeMatch.classList.remove('active');
        }
        listItem.classList.add('active');
    
        currentChatPartnerName = partnerName;
        chatHeader.textContent = `Chat with ${partnerName}`;
        chatMessages.innerHTML = '<p>Loading messages...</p>';
        
        messageInput.disabled = false;
        sendButton.disabled = false;
        if (isMobile()) {
            document.querySelector('.chat-container').classList.add('show-chat');
            backButton.style.display = 'flex';
        }
    
        // Check if a chat already exists
        const chatsRef = collection(db, 'chats');
        const chatQuery = query(chatsRef, 
            where('users', 'array-contains', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(chatQuery);
        let chatDoc = querySnapshot.docs.find(doc => 
            doc.data().users.includes(partnerId)
        );
    
        if (!chatDoc) {
            // Create a new chat if it doesn't exist
            const newChatRef = await addDoc(chatsRef, {
                users: [auth.currentUser.uid, partnerId],
                lastMessage: null,
                messages: {}
            });
            chatDoc = await getDoc(newChatRef);
        }
    
        currentChatId = chatDoc.id;
        console.log('Current chat ID set to:', currentChatId);
        loadMessages(chatDoc);
    }
        
    function loadMessages(chatDoc) {
        const chatData = chatDoc.data();
        chatMessages.innerHTML = '';
        lastDisplayedMessageTimestamp = 0;

        // Sort messages by timestamp
        const sortedMessages = Object.values(chatData.messages).sort((a, b) => {
            return (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0);
        });

        sortedMessages.forEach((message) => {
            displayMessage(message);
            if (message.timestamp) {
                lastDisplayedMessageTimestamp = Math.max(lastDisplayedMessageTimestamp, message.timestamp.toMillis());
            }
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;

        onSnapshot(doc(db, 'chats', currentChatId), (doc) => {
            const updatedChat = doc.data();
            const newMessages = Object.values(updatedChat.messages)
                .filter(message => message.timestamp && message.timestamp.toMillis() > lastDisplayedMessageTimestamp)
                .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

            newMessages.forEach((message) => {
                displayMessage(message);
                lastDisplayedMessageTimestamp = Math.max(lastDisplayedMessageTimestamp, message.timestamp.toMillis());
            });
            if (newMessages.length > 0) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
    }
    
    function displayMessage(message) {
        // Check if the message is already displayed
        if (document.getElementById(`message-${message.id}`)) {
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.id = `message-${message.id}`;
        messageElement.classList.add('message');
        const isCurrentUser = message.senderId === auth.currentUser.uid;
        messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
        
        const senderName = isCurrentUser ? 'You' : currentChatPartnerName;
        messageElement.innerHTML = `
            <strong>${senderName}:</strong>
            <span>${message.text}</span>
        `;
        
        // Find the correct position to insert the new message
        let insertPosition = chatMessages.children.length;
        for (let i = 0; i < chatMessages.children.length; i++) {
            const existingMessage = chatMessages.children[i];
            const existingTimestamp = parseInt(existingMessage.dataset.timestamp || '0');
            if (existingTimestamp > (message.timestamp?.toMillis() || 0)) {
                insertPosition = i;
                break;
            }
        }
        
        // Insert the message at the correct position
        if (insertPosition === chatMessages.children.length) {
            chatMessages.appendChild(messageElement);
        } else {
            chatMessages.insertBefore(messageElement, chatMessages.children[insertPosition]);
        }

        // Store the timestamp as a data attribute for future sorting
        messageElement.dataset.timestamp = message.timestamp?.toMillis() || '0';
    }

    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText || !currentChatId) return;

        const messageId = Date.now().toString();
        const newMessage = {
            id: messageId,
            senderId: auth.currentUser.uid,
            text: messageText,
            timestamp: serverTimestamp()
        };

        // Clear input field immediately
        messageInput.value = '';

        try {
            const chatRef = doc(db, 'chats', currentChatId);
            await updateDoc(chatRef, {
                [`messages.${messageId}`]: newMessage,
                lastMessage: newMessage
            });
            console.log('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }
});