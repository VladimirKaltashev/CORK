export type Theme = 'obsidian' | 'acid' | 'blueprint' | 'bubblegum' | 'tribunal-paper'

export type ThemeStatus = 'default' | 'available' | 'planned' | 'deprecated'

export interface ThemeMetadata {
  id: Theme
  name: string
  description: string
  status: ThemeStatus
  designTraits?: string[]
}

export const THEME_REGISTRY: ThemeMetadata[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Blood',
    description: 'Default CORK world — dark arena of verdicts, brutal but not neon',
    status: 'default',
    designTraits: [
      'dark surfaces',
      'hard borders',
      'low glow',
      'compact density',
      'strong verdict accents',
      'crown/clown as social judgment',
    ],
  },
  {
    id: 'acid',
    name: 'Acid Pop',
    description: 'Cyber terminal / HUD energy — acid poster, rave, internet board',
    status: 'available',
    designTraits: [
      'acid green / pink harsh contrast',
      'sharp forms, zero radius',
      'monospace typography',
      'grid background with scanlines',
      'HUD corner decorations',
      'glow blobs',
    ],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Technical paper world — engineering drawing, court diagram, reputation blueprint',
    status: 'planned',
    designTraits: [
      'white/off-white technical paper',
      'blueprint blue lines',
      'grid/measurement marks',
      'precise borders',
      'stamped controls',
      'airy layout',
    ],
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    description: 'Soft expressive world — gum, candy, warm social energy',
    status: 'planned',
    designTraits: [
      'pastel pink/blue/lavender/cream',
      'large radii, pill controls',
      'soft shadows',
      'friendly cards',
      'must keep contrast and structure',
    ],
  },
  {
    id: 'tribunal-paper',
    name: 'Tribunal Paper',
    description: 'Paper/court/archive world — public judgment, record, verdict sheet',
    status: 'planned',
    designTraits: [
      'paper-like surfaces',
      'black typography',
      'red stamps/marks',
      'thin rules',
      'table/archive structure',
      'serious editorial feeling',
    ],
  },
]

export const DEFAULT_THEME: Theme = 'obsidian'

export const LEGACY_THEME_MAP: Record<string, Theme> = {
  dark: 'obsidian',
  light: 'obsidian',
  system: 'obsidian',
}

export function getThemeMetadata(id: Theme): ThemeMetadata | undefined {
  return THEME_REGISTRY.find((t) => t.id === id)
}

export function getSelectableThemes(): ThemeMetadata[] {
  return THEME_REGISTRY.filter((t) => t.status === 'default' || t.status === 'available')
}

export function isThemeSelectable(id: Theme): boolean {
  const meta = getThemeMetadata(id)
  return meta?.status === 'default' || meta?.status === 'available'
}

export function resolveTheme(input: string | null | undefined): Theme {
  if (!input) return DEFAULT_THEME
  const normalized = input.toLowerCase()
  if (LEGACY_THEME_MAP[normalized]) return LEGACY_THEME_MAP[normalized]
  const valid = THEME_REGISTRY.find((t) => t.id === normalized)
  return valid ? valid.id : DEFAULT_THEME
}