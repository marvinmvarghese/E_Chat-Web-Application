// WhatsApp-inspired theme configuration

export const whatsappTheme = {
    light: {
        // Primary Colors
        primary: '#25D366',      // WhatsApp green
        primaryDark: '#075E54',  // Dark green (header)
        primaryLight: '#DCF8C6', // Light green (sent messages)

        // Background Colors
        background: '#FFFFFF',
        chatBackground: '#E5DDD5', // WhatsApp chat wallpaper color
        sidebarBackground: '#FFFFFF',

        // Message Bubbles
        sentBubble: '#DCF8C6',
        receivedBubble: '#FFFFFF',

        // Text Colors
        textPrimary: '#000000',
        textSecondary: '#667781',
        textMuted: '#8696A0',
        textOnPrimary: '#FFFFFF',

        // Border Colors
        border: '#E9EDEF',
        divider: '#E9EDEF',

        // Status Colors
        online: '#25D366',
        offline: '#8696A0',
        typing: '#25D366',

        // UI Elements
        hover: '#F5F6F6',
        active: '#F0F2F5',
        selected: '#F0F2F5',
        unreadBadge: '#25D366',

        // Icons
        iconPrimary: '#54656F',
        iconSecondary: '#8696A0',
    },

    dark: {
        // Primary Colors
        primary: '#00A884',      // Darker green for dark mode
        primaryDark: '#1F2C33',  // Dark header
        primaryLight: '#005C4B', // Dark sent messages

        // Background Colors
        background: '#0B141A',
        chatBackground: '#0B141A',
        sidebarBackground: '#111B21',

        // Message Bubbles
        sentBubble: '#005C4B',
        receivedBubble: '#202C33',

        // Text Colors
        textPrimary: '#E9EDEF',
        textSecondary: '#8696A0',
        textMuted: '#667781',
        textOnPrimary: '#FFFFFF',

        // Border Colors
        border: '#2A3942',
        divider: '#2A3942',

        // Status Colors
        online: '#00A884',
        offline: '#667781',
        typing: '#00A884',

        // UI Elements
        hover: '#202C33',
        active: '#2A3942',
        selected: '#2A3942',
        unreadBadge: '#00A884',

        // Icons
        iconPrimary: '#AEBAC1',
        iconSecondary: '#8696A0',
    }
};

export const typography = {
    fontFamily: {
        base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        emoji: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    },
    fontSize: {
        xs: '11px',
        sm: '12px',
        base: '14px',
        md: '15px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
};

export const borderRadius = {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
};

export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

export const animations = {
    duration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
    },
    easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
};

export const breakpoints = {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
};
