const state = {
    email: null,
    userId: null,
    token: localStorage.getItem('token'),
    ws: null,
    currentChatId: null, // User ID or Group ID
    currentChatType: null, // 'user' or 'group'
    contacts: [],
    groups: [],
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

    // Mobile Init: Show sidebar
    showList();

    document.getElementById('current-user-email').innerText = state.email;
    document.getElementById('btn-logout').onclick = logout;

    await Promise.all([loadContacts(), loadGroups()]);
    connectWs();
}

// --- Navigation (Mobile) ---
const sidebar = document.getElementById('sidebar');
const chatArea = document.getElementById('chat-area');
const btnBack = document.getElementById('btn-back-mobile');

function showList() {
    sidebar.classList.add('active-mobile-view');
    chatArea.classList.remove('active-mobile-view');
}

function showChatView() {
    sidebar.classList.remove('active-mobile-view');
    chatArea.classList.add('active-mobile-view');
}

btnBack.onclick = showList;

// --- Loading Data ---
async function loadContacts() {
    const res = await def_fetch('/chat/contacts');
    if (res && res.ok) { state.contacts = await res.json(); renderAll(); }
}

async function loadGroups() {
    const res = await def_fetch('/chat/groups');
    if (res && res.ok) { state.groups = await res.json(); renderAll(); }
}

function renderAll() {
    const list = document.getElementById('contact-list');
    list.innerHTML = '';

    // Groups
    if (state.groups.length > 0) {
        const groupHeader = document.createElement('div');
        groupHeader.innerText = "Groups";
        groupHeader.style.padding = "10px";
        groupHeader.style.fontSize = "0.8rem";
        groupHeader.style.color = "#aaa";
        list.appendChild(groupHeader);
        state.groups.forEach(g => {
            const div = document.createElement('div');
            div.className = `contact-item ${state.currentChatId === g.id && state.currentChatType === 'group' ? 'active' : ''}`;
            div.innerHTML = `<div class="avatar">#</div><div class="contact-info"><span class="contact-name">${g.name}</span></div>`;
            div.onclick = () => selectChat(g, 'group');
            list.appendChild(div);
        });
    }

    // Contacts
    const userHeader = document.createElement('div');
    userHeader.innerText = "Direct Messages";
    userHeader.style.padding = "10px";
    userHeader.style.fontSize = "0.8rem";
    userHeader.style.color = "#aaa";
    list.appendChild(userHeader);

    state.contacts.forEach(user => {
        const div = document.createElement('div');
        div.className = `contact-item ${state.currentChatId === user.id && state.currentChatType === 'user' ? 'active' : ''}`;
        div.innerHTML = `<div class="avatar">${user.email.substring(0, 2).toUpperCase()}</div><div class="contact-info"><span class="contact-name">${user.email}</span></div>`;
        div.onclick = () => selectChat(user, 'user');
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

// --- Groups Creation ---
const modalCreateGroup = document.getElementById('modal-create-group');
document.getElementById('btn-create-group').onclick = () => modalCreateGroup.classList.add('active');
document.getElementById('btn-cancel-group').onclick = () => modalCreateGroup.classList.remove('active');
document.getElementById('btn-confirm-group').onclick = async () => {
    const name = document.getElementById('group-name-input').value;
    if (!name) return;
    const res = await def_fetch('/chat/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (res.ok) { showToast("Group Created!"); loadGroups(); modalCreateGroup.classList.remove('active'); }
};

// --- Chat Selection ---
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const typingIndicator = document.getElementById('typing-indicator');

async function selectChat(target, type) { // type: 'user' or 'group'
    state.currentChatId = target.id;
    state.currentChatType = type;

    document.getElementById('chat-partner-name').innerText = type === 'group' ? target.name : target.email;
    document.getElementById('no-chat-selected').style.display = 'none';
    document.getElementById('chat-view').style.display = 'flex';

    // Mobile toggle
    showChatView();

    renderAll(); // update active state

    const url = type === 'group'
        ? `/chat/history/${target.id}?is_group=true`
        : `/chat/history/${target.id}`;

    const res = await def_fetch(url);
    if (res.ok) {
        renderMessages(await res.json());
        if (type === 'user') sendReadReceipt(target.id);
    }
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

    let contentHtml = '';
    if (msg.file_url) {
        if (msg.file_type.startsWith('image/')) {
            contentHtml = `<img src="${msg.file_url}" class="img-preview" onclick="window.open('${msg.file_url}')">`;
        } else {
            contentHtml = `<a href="${msg.file_url}" target="_blank" class="file-msg-bubble"><span class="file-icon">📄</span> ${msg.file_name}</a>`;
        }
        if (msg.content) contentHtml += `<div style="margin-top:5px;">${msg.content}</div>`;
    } else {
        contentHtml = `<div class="msg-content">${msg.content}</div>`;
    }

    div.innerHTML = `
        ${contentHtml}
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
            // Check if this message belongs to current chat
            let isCurrent = false;
            // Case 1: Group Chat match
            if (state.currentChatType === 'group' && data.group_id === state.currentChatId) isCurrent = true;
            // Case 2: Direct Chat match (Sender matches partner OR I am sender)
            if (state.currentChatType === 'user' && !data.group_id && (data.sender_id === state.currentChatId || data.sender_id === state.userId)) isCurrent = true;

            if (isCurrent) {
                appendMessage(data);
                if (data.sender_id === state.currentChatId) sendReadReceipt(state.currentChatId); // Only read receipt to user for now
            } else {
                showToast("New message");
                // Refresh list to show unread? (Future)
            }
        }
    };

    state.ws.onclose = () => { setTimeout(connectWs, 3000); };
}

// Sending
document.getElementById('btn-send-message').onclick = sendMessage;
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && !state.pendingFile) return;
    if (!state.currentChatId) return;

    if (state.pendingFile) {
        // Upload File First
        const formData = new FormData();
        formData.append('file', state.pendingFile);
        const res = await def_fetch('/chat/upload', { method: 'POST', body: formData }); // browser sets content-type multipart
        if (res.ok) {
            const media = await res.json();
            sendWs({
                type: 'file',
                content: text,
                receiver_id: state.currentChatType === 'user' ? state.currentChatId : null,
                group_id: state.currentChatType === 'group' ? state.currentChatId : null,
                file_url: media.url,
                file_type: media.type,
                file_name: media.filename,
                file_size: media.size
            });
        }
        state.pendingFile = null;
        document.getElementById('btn-attach-file').innerHTML = '📎'; // Reset icon
    } else {
        // Text Only
        sendWs({
            type: 'text',
            content: text,
            receiver_id: state.currentChatType === 'user' ? state.currentChatId : null,
            group_id: state.currentChatType === 'group' ? state.currentChatId : null
        });
    }

    messageInput.value = '';
}

function sendReadReceipt(id) {
    // Only for users for now
    if (state.currentChatType === 'user') sendWs({ type: 'message_read', receiver_id: id });
}

// --- Files ---
const fileInput = document.getElementById('file-input');
const btnAttach = document.getElementById('btn-attach-file');

btnAttach.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        state.pendingFile = file;
        btnAttach.innerHTML = '✅'; // Show SELECTED state
        messageInput.focus();
    }
};

if (state.token) initApp();
