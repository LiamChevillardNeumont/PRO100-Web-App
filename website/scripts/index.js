const socket = io.connect('http://localhost:6060');
const messageContainer = document.getElementById('messages');
const form = document.getElementById('message-form');
const sendButton = document.getElementById('b')
const input = document.getElementById('message-input');
const roomNameElement = document.getElementById('title')
let admin_user_id;

//Disables chat functionality before reenabling it when password is entered

form.classList.add('dulled')

//////////////////////////////  Room Setup  //////////////////////////////

console.log(window.location.pathname)
const roomId = window.location.pathname.replace('/chatroom/', '')
console.log(`Room id: ${roomId}`)

socket.emit('room exists', roomId)

socket.on('room exists', (roomExists, roomName) => {
    if (!roomExists) {
        window.location.replace('http://localhost:6060/new')
    } else {
        if (roomName) {
            roomNameElement.innerHTML = roomName
            roomNameElement.addEventListener('click', () => {
                navigator.clipboard.writeText(window.location.href)
            })
        }
    }
})


const getUserId = () => {
    let storedUserId = localStorage.getItem('user_id')
    if (storedUserId) {
        console.log(`user_id already stored: ${storedUserId}`)
        return Number(storedUserId)
    }
    storedUserId = Math.floor((Math.random() * 10000))
    console.log(`user_id not stored or not number, new id: ${storedUserId}`)
    localStorage.setItem('user_id', storedUserId)
    return Number(storedUserId)
}

const userId = getUserId() 

addEventListener('beforeunload', () => {
    socket.emit('leave room', roomId, userId)
})

////////////////////////////// Password Modal /////////////////////////////

const modal = document.getElementById('passwordModal')
const passwordInput = document.getElementById('passwordInput')
const passwordCheckButton = document.getElementById('submitPassword')

window.onload = () => {
    modal.style.display = "block"
}

// Check the password when the submit button is clicked
passwordCheckButton.onclick = () => {
    const passwordString = passwordInput.value

    socket.emit('join room', roomId, passwordString, userId)

    socket.on('join room', (passwordCorrect, adminUserId) => {
        if (passwordCorrect) {
            admin_user_id = adminUserId || 0
            modal.style.display = "none"
            form.classList.remove('dulled')
        } else {
            alert("Incorrect password!")
        }
    })
}

socket.on('connect', () => {
    console.log('Connected to the server.')
});

//////////////////////////////  Recieve Message   //////////////////////////////

const formatDate = (isoString) => {
    let dateObj = new Date(isoString);

    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${month}/${day} ${hours}:${minutes}`;
}

const displayMessage = (data) => {
    if (data == null) {
        return
    }
    console.log(`Received: ${data.user_id}: ${data.content}`)
    // Format date for local time
    const formattedDate = formatDate(data.timestamp)

    // Create messageElement and assign text
    const messageElement = document.createElement('li')

    if (data.content.includes(userId)) {
        return
    }

    if (data.user_id === userId) {
        messageElement.innerHTML = `<div class="metadata">me (${data.user_id}) @ ${formattedDate}:</div><div class="messageContent">${data.content}</div>`;
    } else if (data.user_id == admin_user_id) {
        messageElement.innerHTML = `<div class="metadata"> announcement @ ${formattedDate}: user #${data.content}</div>`;
    } else {
        messageElement.innerHTML = `<div class="metadata"> (${data.user_id}) @ ${formattedDate}:</div><div class="messageContent">${data.content}</div>`;

    }
    // Add messageElement to the messageContainer
    messageContainer.appendChild(messageElement)

    scrollToBottom()
} 

// Recieve and display message history
socket.on('message log', (data) => {
    if (!data) return
    for (index in data) {
        displayMessage(data[index])
    }
})

// Recieve, and display message
socket.on('chat message', (data) => {
    displayMessage(data)
})

//////////////////////////////  Send Message   //////////////////////////////

// sends the message, you just pass in the message body
const sendMessage = (content) => {
    content = content.trim()
    if (!content || content.length === 0) {
        return
    }
    if (content == '/clearId') {
        localStorage.clear()
        return
    }
    let data = {
        'id':null,
        'user_id':userId,
        'content':content
    }
    socket.emit('chat message', data, roomId)
}

// On sendButton click, send the message to the server
sendButton.addEventListener('click', (event) => {
    event.preventDefault();
    const content = input.value;
    input.value = '';
    sendMessage(content)
    scrollToBottom();
})

form.addEventListener('submit', (event) => {//code to fix enter bug
    event.preventDefault();
    const content = input.value;
    input.value = '';
    sendMessage(content)
    scrollToBottom();
})


const messagesContainer = document.getElementById("messages");

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


//theme code
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const messagesList = document.getElementById('messages');

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    messagesList.classList.toggle('dark-theme'); // Toggle class for messages
});