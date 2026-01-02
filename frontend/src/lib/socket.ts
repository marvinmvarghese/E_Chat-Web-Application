import { io, Socket } from 'socket.io-client';
import { useChatStore, getChatKey, Message } from './store';

class SocketService {
    private socket: Socket | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private connectionStatusCallback: ((status: 'connected' | 'disconnected' | 'reconnecting') => void) | null = null;

    /**
     * Connect to Socket.IO server
     */
    connect(token: string) {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        this.token = token;
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

        console.log('Connecting to Socket.IO server:', wsUrl);

        this.socket = io(wsUrl, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        this.setupEventHandlers();
    }

    /**
     * Setup all Socket.IO event handlers
     */
    private setupEventHandlers() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Socket.IO connected');
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('connected');
        });

        this.socket.on('connected', (data) => {
            console.log('Server confirmed connection:', data);
            useChatStore.getState().setConnectionStatus('connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket.IO disconnected:', reason);
            this.updateConnectionStatus('disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.reconnectAttempts++;
            this.updateConnectionStatus('reconnecting');
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
            this.updateConnectionStatus('reconnecting');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('✅ Reconnected after', attemptNumber, 'attempts');
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('connected');
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ Reconnection failed after max attempts');
            this.updateConnectionStatus('disconnected');
        });

        // Message events
        this.socket.on('new_message', (data) => {
            console.log('📨 New message received:', data);
            this.handleNewMessage(data);
        });

        // Typing events
        this.socket.on('typing_start', (data) => {
            console.log('⌨️ User typing:', data);
            this.handleTypingStart(data);
        });

        this.socket.on('typing_stop', (data) => {
            console.log('⌨️ User stopped typing:', data);
            this.handleTypingStop(data);
        });

        // Status events
        this.socket.on('user_status', (data) => {
            console.log('👤 User status update:', data);
            this.handleUserStatus(data);
        });

        // Read receipts
        this.socket.on('message_read', (data) => {
            console.log('✓✓ Message read:', data);
            this.handleMessageRead(data);
        });

        // Profile updates
        this.socket.on('contact_profile_updated', (data) => {
            console.log('👤 Contact profile updated:', data);
            this.handleContactProfileUpdated(data);
        });

        // Error events
        this.socket.on('error', (data) => {
            console.error('Socket error:', data);
        });
    }

    /**
     * Handle incoming message
     */
    private handleNewMessage(data: any) {
        const authState = JSON.parse(localStorage.getItem('echat-auth-storage') || '{}');
        const currentUserId = authState?.state?.user?.id;

        let key = '';

        if (data.group_id) {
            key = getChatKey(data.group_id, 'group');
        } else {
            const isMe = data.sender_id === currentUserId;
            const otherId = isMe ? data.receiver_id : data.sender_id;
            key = getChatKey(otherId, 'contact');
        }

        const message: Message = {
            id: data.id,
            content: data.content,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            group_id: data.group_id,
            created_at: data.created_at,
            status: data.status,
            file_url: data.file_url,
            file_type: data.file_type,
            file_name: data.file_name,
            sender: data.sender_id === currentUserId ? 'me' : 'them'
        };

        useChatStore.getState().addMessage(key, message);
    }

    /**
     * Handle typing start event
     */
    private handleTypingStart(data: any) {
        const { user_id, receiver_id, group_id } = data;

        if (group_id) {
            const key = getChatKey(group_id, 'group');
            useChatStore.getState().setTyping(key, user_id, true);
        } else if (receiver_id) {
            const key = getChatKey(user_id, 'contact');
            useChatStore.getState().setTyping(key, user_id, true);
        }
    }

    /**
     * Handle typing stop event
     */
    private handleTypingStop(data: any) {
        const { user_id, receiver_id, group_id } = data;

        if (group_id) {
            const key = getChatKey(group_id, 'group');
            useChatStore.getState().setTyping(key, user_id, false);
        } else if (receiver_id) {
            const key = getChatKey(user_id, 'contact');
            useChatStore.getState().setTyping(key, user_id, false);
        }
    }

    /**
     * Handle user status update
     */
    private handleUserStatus(data: any) {
        const { user_id, status } = data;
        useChatStore.getState().updateUserStatus(user_id, status);
    }

    /**
     * Handle message read receipt
     */
    private handleMessageRead(data: any) {
        const { message_id, read_by } = data;
        useChatStore.getState().updateMessageStatus(message_id, 'read');
    }

    /**
     * Send a message
     */
    sendMessage(payload: {
        type?: string;
        content?: string;
        receiver_id?: number;
        group_id?: number;
        file_url?: string;
        file_type?: string;
        file_name?: string;
        file_size?: number;
    }) {
        if (!this.socket?.connected) {
            console.error('Socket not connected');
            return false;
        }

        this.socket.emit('send_message', payload);
        return true;
    }

    /**
     * Send typing indicator
     */
    sendTypingStart(receiver_id?: number, group_id?: number) {
        if (!this.socket?.connected) return;

        this.socket.emit('typing_start', { receiver_id, group_id });
    }

    sendTypingStop(receiver_id?: number, group_id?: number) {
        if (!this.socket?.connected) return;

        this.socket.emit('typing_stop', { receiver_id, group_id });
    }

    /**
     * Send message read receipt
     */
    sendMessageRead(message_id: number) {
        if (!this.socket?.connected) return;

        this.socket.emit('message_read', { message_id });
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Set connection status callback
     */
    onConnectionStatusChange(callback: (status: 'connected' | 'disconnected' | 'reconnecting') => void) {
        this.connectionStatusCallback = callback;
    }

    /**
     * Update connection status
     */
    private updateConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
        useChatStore.getState().setConnectionStatus(status);
        if (this.connectionStatusCallback) {
            this.connectionStatusCallback(status);
        }
    }

    /**
     * Handle contact profile update
     */
    private handleContactProfileUpdated(data: any) {
        const { user_id, display_name, about, profile_photo_url } = data;

        // Update contact in store with all profile fields
        const chatStore = useChatStore.getState();
        const contacts = chatStore.contacts.map(contact => {
            if (contact.id === user_id) {
                return {
                    ...contact,
                    name: display_name || contact.email.split('@')[0],
                    about: about,
                    profile_photo_url: profile_photo_url
                };
            }
            return contact;
        });

        chatStore.setContacts(contacts);
        console.log(`✅ Updated profile for contact ${user_id}:`, { display_name, about, profile_photo_url });
    }

    /**
     * Emit profile update to notify contacts
     */
    emitProfileUpdate(profileData: { display_name?: string; about?: string; profile_photo_url?: string | null }) {
        if (this.socket?.connected) {
            this.socket.emit('profile_updated', profileData);
        }
    }
}

export const socketService = new SocketService();
