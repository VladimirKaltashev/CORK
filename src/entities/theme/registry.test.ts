import { describe, expect, it } from 'vitest'
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  LEGACY_THEME_MAP,
  getThemeMetadata,
  getSelectableThemes,
  isThemeSelectable,
  resolveTheme,
  type Theme,
} from './registry'

describe('THEME_REGISTRY', () => {
  it('contains obsidian as default', () => {
    const obsidian = THEME_REGISTRY.find((t) => t.id === 'obsidian')
    expect(obsidian).toBeDefined()
    expect(obsidian!.status).toBe('default')
  })

  it('contains acid as available', () => {
    const acid = THEME_REGISTRY.find((t) => t.id === 'acid')
    expect(acid).toBeDefined()
    expect(acid!.status).toBe('available')
  })

  it('contains blueprint, bubblegum, tribunal-paper as planned', () => {
    const plannedIds = THEME_REGISTRY
      .filter((t) => t.status === 'planned')
      .map((t) => t.id)
    expect(plannedIds).toContain('blueprint')
    expect(plannedIds).toContain('bubblegum')
    expect(plannedIds).toContain('tribunal-paper')
  })

  it('every theme has id, name, description, status', () => {
    for (const t of THEME_REGISTRY) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(t.status).toBeTruthy()
    }
  })
})

describe('DEFAULT_THEME', () => {
  it('is obsidian', () => {
    expect(DEFAULT_THEME).toBe('obsidian')
  })
})

describe('LEGACY_THEME_MAP', () => {
  it('maps dark to obsidian', () => {
    expect(LEGACY_THEME_MAP.dark).toBe('obsidian')
  })

  it('maps light to obsidian', () => {
    expect(LEGACY_THEME_MAP.light).toBe('obsidian')
  })

  it('maps system to obsidian', () => {
    expect(LEGACY_THEME_MAP.system).toBe('obsidian')
  })
})

describe('getThemeMetadata', () => {
  it('returns metadata for valid theme', () => {
    const meta = getThemeMetadata('obsidian')
    expect(meta).toBeDefined()
    expect(meta!.id).toBe('obsidian')
  })

  it('returns undefined for unknown theme', () => {
    expect(getThemeMetadata('unknown' as Theme)).toBeUndefined()
  })
})

describe('getSelectableThemes', () => {
  it('returns only default and available themes', () => {
    const selectable = getSelectableThemes()
    const ids = selectable.map((t) => t.id)
    expect(ids).toContain('obsidian')
    expect(ids).toContain('acid')
    expect(ids).not.toContain('blueprint')
    expect(ids).not.toContain('bubblegum')
    expect(ids).not.toContain('tribunal-paper')
  })
})

describe('isThemeSelectable', () => {
  it('returns true for obsidian', () => {
    expect(isThemeSelectable('obsidian')).toBe(true)
  })

  it('returns true for acid', () => {
    expect(isThemeSelectable('acid')).toBe(true)
  })

  it('returns false for planned themes', () => {
    expect(isThemeSelectable('blueprint')).toBe(false)
    expect(isThemeSelectable('bubblegum')).toBe(false)
    expect(isThemeSelectable('tribunal-paper')).toBe(false)
  })
})

describe('resolveTheme', () => {
  it('returns obsidian for null/undefined/empty', () => {
    expect(resolveTheme(null)).toBe('obsidian')
    expect(resolveTheme(undefined)).toBe('obsidian')
    expect(resolveTheme('')).toBe('obsidian')
  })

  it('resolves valid theme id', () => {
    expect(resolveTheme('acid')).toBe('acid')
    expect(resolveTheme('obsidian')).toBe('obsidian')
  })

  it('resolves legacy dark to obsidian', () => {
    expect(resolveTheme('dark')).toBe('obsidian')
  })

  it('resolves legacy light to obsidian', () => {
    expect(resolveTheme('light')).toBe('obsidian')
  })

  it('resolves legacy system to obsidian', () => {
    expect(resolveTheme('system')).toBe('obsidian')
  })

  it('resolves unknown value to obsidian', () => {
    expect(resolveTheme('foobar')).toBe('obsidian')
  })

  it('is case-insensitive for legacy values', () => {
    expect(resolveTheme('Dark')).toBe('obsidian')
    expect(resolveTheme('LIGHT')).toBe('obsidian')
  })
})