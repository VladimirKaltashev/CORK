import { describe, expect, it } from 'vitest'

describe('supabase client', () => {
  it('supabase module exports a client', async () => {
    const mod = await import('./supabase')
    expect(mod).toHaveProperty('supabase')
    expect(mod.supabase).toBeDefined()
  })
})
