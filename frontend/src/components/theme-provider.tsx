"use client"

import * as React from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(
    undefined
)

export function ThemeProvider({
    children,
    defaultTheme = "light",
    storageKey = "echat-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        // Load theme from localStorage
        const stored = localStorage.getItem(storageKey) as Theme | null
        if (stored) {
            setThemeState(stored)
        } else {
            // Check system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
            setThemeState(prefersDark ? "dark" : "light")
        }
    }, [storageKey])

    React.useEffect(() => {
        if (!mounted) return

        const root = window.document.documentElement
        root.setAttribute("data-theme", theme)
        localStorage.setItem(storageKey, theme)
    }, [theme, storageKey, mounted])

    const setTheme = React.useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
    }, [])

    const toggleTheme = React.useCallback(() => {
        setThemeState((prev) => (prev === "light" ? "dark" : "light"))
    }, [])

    const value = React.useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme,
        }),
        [theme, setTheme, toggleTheme]
    )

    // Prevent flash of wrong theme
    if (!mounted) {
        return null
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = React.useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
