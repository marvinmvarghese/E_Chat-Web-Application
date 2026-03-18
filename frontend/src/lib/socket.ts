import { io, Socket } from 'socket.io-client';
import { useChatStore, useAuthStore, getChatKey, Message } from './store';

class SocketService {
    private socket: Socket | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private connectionStatusCallback: ((status: 'connected' | 'disconnected' | 'reconnecting') => void) | null = null;
    // Callback invoked when backend returns message_error, so chat-window can HTTP-retry
    messageErrorCallback: ((tempId: number | null) => void) | null = null;

    /**
     * Connect to Socket.IO server
     */
    connect(token: string) {
        // If already connected with same token, skip
        if (this.socket?.connected && this.token === token) {
            console.log('Socket already connected');
            return;
        }

        // Disconnect stale socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.token = token;
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

        console.log('Connecting to Socket.IO server:', wsUrl);

        this.socket = io(wsUrl, {
            auth: { token },
            // Use polling first then upgrade — more reliable through proxies (Railway, Vercel)
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            timeout: 30000,
            forceNew: true,
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
            // Auto-request notification permission on first connect
            if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                Notification.requestPermission();
            }
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
        // `new_message` → received by the OTHER party (receiver)
        // `message_sent` → received ONLY by the sender as confirmation
        this.socket.on('new_message', (data) => {
            console.log('📨 New message received:', data);
            this.handleNewMessage(data);
        });

        this.socket.on('message_sent', (data) => {
            console.log('✅ Message confirmed by server:', data);
            // Treat exactly the same as new_message — it will replace the optimistic bubble
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

        // Edit / delete events
        this.socket.on('message_edited', (data: { message_id: number; content: string; sender_id: number; receiver_id?: number; group_id?: number }) => {
            const store = useChatStore.getState();
            const authState = JSON.parse(localStorage.getItem('echat-auth-storage') || '{}');
            const currentUserId = authState?.state?.user?.id;
            const otherId = data.sender_id === currentUserId ? data.receiver_id : data.sender_id;
            const key = data.group_id ? getChatKey(data.group_id, 'group') : getChatKey(otherId as number, 'contact');
            store.editMessageInStore(key, data.message_id, data.content);
        });

        this.socket.on('message_deleted', (data: { message_id: number }) => {
            const store = useChatStore.getState();
            // Remove from all chat keys (it could be in any conversation)
            const messages = store.messages;
            for (const key in messages) {
                const found = messages[key].find(m => m.id === data.message_id);
                if (found) { store.deleteMessageFromStore(key, data.message_id); break; }
            }
        });

        // Error events
        this.socket.on('error', (data) => {
            console.error('Socket error:', data);
        });

        // message_error: backend failed to process the message (session lost, DB error, etc.)
        // Automatically fall back to HTTP so the message is never lost.
        this.socket.on('message_error', (data: { error: string; message?: string; _tempId?: number }) => {
            console.warn('⚠️ message_error received, falling back to HTTP:', data);
            // The chat-window registered a pending-message callback that we invoke here
            if (this.messageErrorCallback) {
                this.messageErrorCallback(data._tempId ?? null);
            }
        });
    }


    /**
     * Handle incoming message
     */
    private handleNewMessage(data: { 
        id: number; content?: string; sender_id: number; receiver_id?: number;
        group_id?: number; created_at: string; status?: string;
        file_url?: string; file_type?: string; file_name?: string;
        _tempId?: number;
        is_forwarded?: boolean;
        edited?: boolean;
    }) {
        // Use Zustand auth store directly — localStorage parsing can return undefined
        // causing currentUserId to be undefined, making isMe always false,
        // giving the wrong chat key and leaving optimistic messages stuck forever.
        const storeUser = useAuthStore.getState().user;
        // fallback to localStorage only if Zustand state is not yet hydrated
        const currentUserId = storeUser?.id
            ? Number(storeUser.id)
            : (() => {
                  try {
                      const s = JSON.parse(localStorage.getItem('echat-auth-storage') || '{}');
                      return Number(s?.state?.user?.id) || 0;
                  } catch { return 0; }
              })();

        let key = '';
        if (data.group_id) {
            key = getChatKey(data.group_id, 'group');
        } else {
            // Use Number() to prevent type mismatch between string/number IDs
            const isMe = Number(data.sender_id) === currentUserId;
            const otherId = isMe ? data.receiver_id : data.sender_id;
            if (!otherId) return; // bail if we can't compute a key
            key = getChatKey(Number(otherId), 'contact');
        }

        const message: Message = {
            id: data.id,
            content: data.content,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            group_id: data.group_id,
            created_at: data.created_at,
            status: data.status || 'sent',
            file_url: data.file_url,
            file_type: data.file_type,
            file_name: data.file_name,
            is_forwarded: data.is_forwarded ?? false,
            edited: data.edited ?? false,
            sender: Number(data.sender_id) === currentUserId ? 'me' : 'them'
        };


        const store = useChatStore.getState();

        if (Number(data.sender_id) === currentUserId && data._tempId) {
            // Replace our optimistic message with the server-confirmed one
            store.replaceOptimisticMessage(key, data._tempId, message);
        } else if (Number(data.sender_id) === currentUserId) {
            // Server echo without tempId — match by content (more accurate than latest-only)
            const current = store.messages[key] || [];
            const matchingOptimistic = [...current].reverse().find(
                m => m.id < 0 && m.sender === 'me' && m.content === message.content
            );
            if (matchingOptimistic) {
                store.replaceOptimisticMessage(key, matchingOptimistic.id, message);
            } else {
                // Last resort: replace the oldest pending optimistic message
                const oldestOptimistic = current.find(m => m.id < 0 && m.sender === 'me');
                if (oldestOptimistic) {
                    store.replaceOptimisticMessage(key, oldestOptimistic.id, message);
                } else {
                    store.addMessage(key, message);
                }
            }
        } else {
            // Message from another user — add normally
            store.addMessage(key, message);
            // OS notification when tab is not focused
            this.showMessageNotification(message);
        }
    }

    private showMessageNotification(message: Message) {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission !== 'granted') return;
        if (document.hasFocus()) return;  // only notify when tab is backgrounded

        const senderName = (() => {
            const contacts = useChatStore.getState().contacts;
            const contact = contacts.find(c => c.id === message.sender_id);
            return contact?.name || contact?.email || 'New message';
        })();

        const body = message.content
            ? (message.content.length > 80 ? message.content.substring(0, 77) + '...' : message.content)
            : '📎 File attachment';

        try {
            const notif = new Notification(`E-Chat · ${senderName}`, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `msg-${message.sender_id}`,
            } as NotificationOptions);
            notif.onclick = () => { window.focus(); notif.close(); };
            setTimeout(() => notif.close(), 5000);
        } catch (_) {}
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
        _tempId?: number;       // optimistic update reconciliation
        is_forwarded?: boolean; // forwarded message flag
        duration?: number;      // voice message duration
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

    /**
     * Edit a sent message
     */
    editMessage(messageId: number, newContent: string) {
        if (!this.socket?.connected) return;
        this.socket.emit('edit_message', { message_id: messageId, content: newContent });
    }

    /**
     * Delete a sent message
     */
    deleteMessage(messageId: number) {
        if (!this.socket?.connected) return;
        this.socket.emit('delete_message', { message_id: messageId });
    }

    // ── WebRTC Call Signaling ─────────────────────────────────────────────

    initiateCall(receiverId: number, callType: 'audio' | 'video', offer: RTCSessionDescriptionInit, callerName?: string, callerAvatar?: string) {
        if (!this.socket?.connected) return;
        this.socket.emit('call_offer', { receiver_id: receiverId, call_type: callType, offer, caller_name: callerName || '', caller_avatar: callerAvatar || '' });
    }

    sendAnswer(callerId: number, answer: RTCSessionDescriptionInit) {
        if (!this.socket?.connected) return;
        this.socket.emit('call_answer', { caller_id: callerId, answer });
    }

    sendIceCandidate(peerId: number, candidate: RTCIceCandidateInit) {
        if (!this.socket?.connected) return;
        this.socket.emit('call_ice_candidate', { peer_id: peerId, candidate });
    }

    endCall(peerId: number) {
        if (!this.socket?.connected) return;
        this.socket.emit('call_end', { peer_id: peerId });
    }

    rejectCall(callerId: number) {
        if (!this.socket?.connected) return;
        this.socket.emit('call_reject', { caller_id: callerId });
    }

    /**
     * Register call event listeners (re-usable by CallManager)
     */
    onCallEvent(event: string, callback: (data: Record<string, unknown>) => void) {
        this.socket?.on(event, callback);
    }

    offCallEvent(event: string, callback: (data: Record<string, unknown>) => void) {
        this.socket?.off(event, callback);
    }
}

export const socketService = new SocketService();

