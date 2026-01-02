import { useChatStore, getChatKey, Message } from "./store";

class WebSocketService {
    private socket: WebSocket | null = null;
    private token: string | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    connect(token: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
        this.token = token;

        // TODO: Update backend to accept query param or header.
        // Standard JS WebSocket only supports Query params for initial handshake usually
        // Backend expects token in query param? Let's check backend:
        // @router.websocket("/ws") async def websocket_endpoint(websocket: WebSocket, token: str, ...):
        // Yes, query param `token`

        // Note: localhost:8000 for backend
        const wsUrl = `ws://localhost:8000/chat/ws?token=${token}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("WebSocket Connected");
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WS Message:", data);
                this.handleMessage(data);
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        this.socket.onclose = () => {
            console.log("WebSocket Disconnected. Reconnecting...");
            this.socket = null;
            this.reconnectTimeout = setTimeout(() => this.connect(token), 3000);
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket Error", error);
            this.socket?.close();
        };
    }

    disconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        if (this.socket) {
            this.socket.onclose = null; // Prevent reconnect
            this.socket.close();
            this.socket = null;
        }
    }

    sendMessage(payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(payload));
        } else {
            console.error("WebSocket not ready");
        }
    }

    private handleMessage(data: any) {
        // data format from backend:
        // { type: "new_message", id, content, sender_id, receiver_id, group_id, status, created_at, ... }

        if (data.type === "new_message") {
            const { sender_id, receiver_id, group_id } = data;

            // Determine store key
            // If it's a group message, key is group_ID
            // If DM, key is contact_ID (sender if incoming, receiver if outgoing? Store logic needs to be consistent)

            // Let's assume the user viewing this is "me".
            // incoming DM -> key should be sender_id (to show in that chat)
            // outgoing DM (echo) -> key should be receiver_id

            // We need 'me' ID to know which one it is.
            // We can get it from authStore, but this class is outside React.
            // We can just check data.sender_id.

            // BUT, better approach:
            // We pass "currentUserId" to handleMessage or store it in class
            const authState = JSON.parse(localStorage.getItem('echat-auth-storage') || '{}');
            const currentUserId = authState?.state?.user?.id;

            let key = "";

            if (group_id) {
                key = getChatKey(group_id, 'group');
            } else {
                // Direct Message
                const isMe = sender_id === currentUserId;
                const otherId = isMe ? receiver_id : sender_id;
                key = getChatKey(otherId, 'contact');
            }

            // Normalize Message for Store
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
    }
}

export const socketService = new WebSocketService();
