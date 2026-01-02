import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ------------------- Types -------------------

export interface User {
    id: number;
    email: string;
    display_name?: string;
    about?: string;
    profile_photo_url?: string;
    theme_preference?: string;
}

export interface Contact {
    id: number;
    email: string;
    name?: string;
    status?: string; // 'online' | 'offline'
    profile_photo_url?: string;
    about?: string;
}

export interface Group {
    id: number;
    name: string;
    isGroup: true;
}

export interface Message {
    id: number;
    content?: string;
    sender_id: number;
    receiver_id?: number;
    group_id?: number;
    created_at: string;
    status: string;
    file_url?: string;
    file_type?: string;
    file_name?: string;
    // UI helper
    sender?: 'me' | 'them';
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (token: string, user: User) => void;
    updateUser: (userData: Partial<User>) => void;
    logout: () => void;
}

// ------------------- Auth Store -------------------

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            setAuth: (token, user) => {
                if (typeof window !== "undefined") {
                    localStorage.setItem("echat_token", token);
                }
                set({ token, user, isAuthenticated: true });
            },
            updateUser: (userData) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null
                }));
            },
            logout: () => {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("echat_token");
                }
                set({ token: null, user: null, isAuthenticated: false });
            },
        }),
        {
            name: 'echat-auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ------------------- Chat Store -------------------

interface ChatState {
    contacts: Contact[];
    groups: Group[];
    activeId: number | null; // ID of selected contact or group
    activeType: 'contact' | 'group' | null;
    messages: Record<string, Message[]>; // Key: "contact_ID" or "group_ID"
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    typingUsers: Record<string, Set<number>>; // Key: chat key, Value: set of user IDs typing
    userStatuses: Record<number, 'online' | 'offline'>; // Key: user ID, Value: status

    setContacts: (contacts: Contact[]) => void;
    setGroups: (groups: Group[]) => void;
    setActiveChat: (id: number, type: 'contact' | 'group') => void;
    setMessages: (key: string, messages: Message[]) => void;
    addMessage: (key: string, message: Message) => void;
    setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
    setTyping: (key: string, userId: number, isTyping: boolean) => void;
    updateUserStatus: (userId: number, status: 'online' | 'offline') => void;
    updateMessageStatus: (messageId: number, status: string) => void;
}

// Helper to generate key
export const getChatKey = (id: number, type: 'contact' | 'group') => `${type}_${id}`;

export const useChatStore = create<ChatState>((set) => ({
    contacts: [],
    groups: [],
    activeId: null,
    activeType: null,
    messages: {},
    connectionStatus: 'disconnected',
    typingUsers: {},
    userStatuses: {},

    setContacts: (contacts) => set({ contacts }),
    setGroups: (groups) => set({ groups }),
    setActiveChat: (id, type) => set({ activeId: id, activeType: type }),

    setMessages: (key, newMessages) =>
        set((state) => ({
            messages: { ...state.messages, [key]: newMessages }
        })),

    addMessage: (key, message) =>
        set((state) => {
            const current = state.messages[key] || [];
            // Check for duplicates
            const exists = current.some(m => m.id === message.id);
            if (exists) return state;

            return {
                messages: { ...state.messages, [key]: [...current, message] }
            };
        }),

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    setTyping: (key, userId, isTyping) =>
        set((state) => {
            const typingUsers = { ...state.typingUsers };
            if (!typingUsers[key]) {
                typingUsers[key] = new Set();
            }

            if (isTyping) {
                typingUsers[key].add(userId);
            } else {
                typingUsers[key].delete(userId);
            }

            return { typingUsers };
        }),

    updateUserStatus: (userId, status) =>
        set((state) => ({
            userStatuses: { ...state.userStatuses, [userId]: status }
        })),

    updateMessageStatus: (messageId, status) =>
        set((state) => {
            const messages = { ...state.messages };

            // Find and update the message
            for (const key in messages) {
                const chatMessages = messages[key];
                const messageIndex = chatMessages.findIndex(m => m.id === messageId);

                if (messageIndex !== -1) {
                    const updatedMessages = [...chatMessages];
                    updatedMessages[messageIndex] = {
                        ...updatedMessages[messageIndex],
                        status
                    };
                    messages[key] = updatedMessages;
                    break;
                }
            }

            return { messages };
        }),
}));

