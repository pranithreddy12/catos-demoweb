import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface Template {
  id: string
  name: string
  tagline: string
  swatch: [string, string, string] // [ink, paper, accent] for the preview chip
}

// Passport templates the user can switch between. The passport (the cat's
// life-history container) stays the same; only the skin changes.
export const TEMPLATES: Template[] = [
  { id: 'atelier', name: 'Atelier', tagline: 'Archival passport · the keepsake', swatch: ['#1A1B2E', '#F4EFDD', '#4B5F42'] },
  { id: 'aurora', name: 'Aurora', tagline: 'Midnight · against her baseline', swatch: ['#8B89DA', '#0E0F1A', '#9FB594'] },
  { id: 'heritage', name: 'Heritage', tagline: 'Vintage passport', swatch: ['#3a2f1e', '#f5efe2', '#b0a487'] },
  { id: 'aqua', name: 'Aqua', tagline: 'Clean & modern', swatch: ['#2563eb', '#ffffff', '#e2e8f0'] },
]

const STORAGE_KEY = 'lunacat-template-v3'
const DEFAULT_THEME = 'atelier'

interface Ctx {
  theme: string
  setTheme: (id: string) => void
  templates: Template[]
}

const ThemeCtx = createContext<Ctx>({ theme: DEFAULT_THEME, setTheme: () => {}, templates: TEMPLATES })

// Pinned to the single polished light theme for beta. The switcher is hidden
// (only the passport/keepsake screens are theme-aware; the rest are hardcoded
// light, so a dark theme would render inconsistently). The template
// infrastructure stays so full app-wide theming can be revisited post-beta.
function initialTheme(): string {
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  return (
    <ThemeCtx.Provider value={{ theme, setTheme: setThemeState, templates: TEMPLATES }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
