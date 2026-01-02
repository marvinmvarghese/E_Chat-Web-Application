import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ------------------- Types -------------------

export interface User {
    id: number;
    email: string;
}

export interface Contact {
    id: number;
    email: string; // Using email as name for now based on backend
    name?: string; // Optional if we enhance backend later
    status?: string; // 'online' | 'offline' - derived from WS later
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

    setContacts: (contacts: Contact[]) => void;
    setGroups: (groups: Group[]) => void;
    setActiveChat: (id: number, type: 'contact' | 'group') => void;
    setMessages: (key: string, messages: Message[]) => void;
    addMessage: (key: string, message: Message) => void;
}

// Helper to generate key
export const getChatKey = (id: number, type: 'contact' | 'group') => `${type}_${id}`;

export const useChatStore = create<ChatState>((set) => ({
    contacts: [],
    groups: [],
    activeId: null,
    activeType: null,
    messages: {},

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
            // Dedup check based on ID if needed, but append for now
            return {
                messages: { ...state.messages, [key]: [...current, message] }
            };
        }),
}));
