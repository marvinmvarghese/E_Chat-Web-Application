const state = {
    email: null,
    userId: null,
    token: localStorage.getItem('token'),
    ws: null,
    currentChatId: null,
    contacts: [],
    typingTimeout: null
};

// --- Toast ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// --- API ---
async function def_fetch(url, options = {}) {
    if (state.token) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${state.token}` };
    }
    try {
        const res = await fetch(url, options);
        if (res.status === 401) { logout(); return null; }
        return res;
    } catch (e) {
        showToast("Network Error", "error");
        return null;
    }
}

// --- Init & Auth ---
const loginForm = document.getElementById('form-login');
const signupForm = document.getElementById('form-signup');
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');

document.getElementById('btn-goto-signup').onclick = () => { loginForm.style.display = 'none'; signupForm.style.display = 'block'; };
document.getElementById('btn-goto-login').onclick = () => { signupForm.style.display = 'none'; loginForm.style.display = 'block'; };

document.getElementById('btn-login').onclick = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) return showToast("Empty fields", "error");
    const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (res.ok) finishAuth(await res.json());
    else showToast("Invalid Credentials", "error");
};

document.getElementById('btn-signup').onclick = async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    if (password.length < 8) return showToast("Password must be 8+ chars", "error");
    const res = await fetch('/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (res.ok) finishAuth(await res.json());
    else { const err = await res.json(); showToast(err.detail || "Signup Failed", "error"); }
};

function finishAuth(data) {
    state.token = data.access_token;
    state.userId = data.user_id;
    state.email = data.email;
    localStorage.setItem('token', state.token);
    initApp();
}

function logout() { localStorage.removeItem('token'); location.reload(); }

async function initApp() {
    if (!state.token) return;
    if (!state.userId) {
        try {
            const payload = JSON.parse(atob(state.token.split('.')[1]));
            state.userId = payload.id;
            state.email = payload.sub;
        } catch (e) { return logout(); }
    }
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    document.getElementById('current-user-email').innerText = state.email;
    document.getElementById('btn-logout').onclick = logout;
    await loadContacts();
    connectWs();
}

async function loadContacts() {
    const res = await def_fetch('/chat/contacts');
    if (res && res.ok) { state.contacts = await res.json(); renderContacts(); }
}

function renderContacts() {
    const list = document.getElementById('contact-list');
    list.innerHTML = '';
    state.contacts.forEach(user => {
        const div = document.createElement('div');
        div.className = `contact-item ${state.currentChatId === user.id ? 'active' : ''}`;
        div.innerHTML = `<div class="avatar">${user.email.substring(0, 2).toUpperCase()}</div><div class="contact-info"><span class="contact-name">${user.email}</span></div>`;
        div.onclick = () => selectChat(user);
        list.appendChild(div);
    });
}

document.getElementById('btn-add-contact').onclick = async () => {
    const email = prompt("Contact Email:");
    if (email) {
        const res = await def_fetch('/chat/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (res.ok) { showToast("Added!", "success"); loadContacts(); } else showToast("Failed to add", "error");
    }
};

// --- Chat ---
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const typingIndicator = document.getElementById('typing-indicator');

async function selectChat(user) {
    state.currentChatId = user.id;
    document.getElementById('chat-partner-name').innerText = user.email;
    document.getElementById('no-chat-selected').style.display = 'none';
    document.getElementById('chat-view').style.display = 'flex';
    renderContacts();
    const res = await def_fetch(`/chat/history/${user.id}`);
    if (res.ok) { renderMessages(await res.json()); sendReadReceipt(user.id); }
}

function renderMessages(msgs) {
    messagesContainer.innerHTML = '';
    msgs.forEach(appendMessage);
    scrollToBottom();
}

function appendMessage(msg) {
    const div = document.createElement('div');
    const isMe = msg.sender_id === state.userId;
    div.className = `message ${isMe ? 'sent' : 'received'}`;

    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let ticksHtml = '';
    if (isMe) {
        const tickClass = msg.status === 'read' ? 'read' : '';
        const tickSign = msg.status === 'sent' ? '✓' : '✓✓';
        ticksHtml = `<span class="tick ${tickClass}">${tickSign}</span>`;
    }

    div.innerHTML = `
        <div class="msg-content">${msg.content}</div>
        <div class="msg-meta">${time} ${ticksHtml}</div>
    `;
    messagesContainer.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() { messagesContainer.scrollTop = messagesContainer.scrollHeight; }

// --- WebSocket & Typing ---
function sendWs(data) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify(data));
    } else {
        console.warn("WS Not Open, cannot send:", data);
        showToast("Connection Lost. Reconnecting...", "error");
        // Optional: queue messages?
    }
}

function connectWs() {
    if (state.ws) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    state.ws = new WebSocket(`${proto}://${location.host}/chat/ws?token=${state.token}`);

    state.ws.onopen = () => { console.log("WS Connected"); };

    state.ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'new_message') {
            if (state.currentChatId && (data.sender_id === state.currentChatId || data.sender_id === state.userId)) {
                // Deduplicate if we already added it locally (if we did optomistic UI, which we didn't)
                // Just append.
                appendMessage(data);
                if (data.sender_id === state.currentChatId) sendReadReceipt(state.currentChatId);
            } else showToast("New message");
        }
        else if (data.type === 'message_read' && state.currentChatId === data.reader_id) {
            document.querySelectorAll('.tick').forEach(el => el.classList.add('read'));
        }
        else if (data.type === 'typing_start' && data.sender_id === state.currentChatId) typingIndicator.style.display = 'block';
        else if (data.type === 'typing_stop' && data.sender_id === state.currentChatId) typingIndicator.style.display = 'none';
    };

    state.ws.onclose = () => {
        console.log("WS Closed");
        state.ws = null;
        setTimeout(connectWs, 3000);
    };
    state.ws.onerror = (err) => { console.error("WS Error", err); };
}

// Text Sending
document.getElementById('btn-send-message').onclick = sendMessage;
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
messageInput.addEventListener('input', () => {
    if (!state.currentChatId) return;
    if (!state.typing) { state.typing = true; sendWs({ type: 'typing_start', receiver_id: state.currentChatId }); }
    clearTimeout(state.typingTimeout);
    state.typingTimeout = setTimeout(() => { state.typing = false; sendWs({ type: 'typing_stop', receiver_id: state.currentChatId }); }, 2000);
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !state.currentChatId) return;

    // Send
    sendWs({ type: 'text', content: text, receiver_id: state.currentChatId });

    // Clear Input
    messageInput.value = '';
    state.typing = false;
    sendWs({ type: 'typing_stop', receiver_id: state.currentChatId });
}

function sendReadReceipt(id) { sendWs({ type: 'message_read', receiver_id: id }); }

if (state.token) initApp();
