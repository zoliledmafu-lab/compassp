import { describe, it, expect } from 'vitest'
import { detectLanguage, isOfflineReady } from '../lib/offlineAI'

// These tests cover the pure, synchronous functions in offlineAI.ts.
// initOfflineModel and askOffline are excluded: they require the 230 MB
// SmolLM2 model download and cannot run in a unit test environment.

describe('detectLanguage', () => {
  it('returns "shona" for text containing "ndinoda"', () => {
    expect(detectLanguage('ndinoda kubatsirwa')).toBe('shona')
  })

  it('returns "ndebele" for text containing "sawubona"', () => {
    expect(detectLanguage('sawubona ngisiza')).toBe('ndebele')
  })

  it('returns "english" for plain English text with no Shona or Ndebele words', () => {
    expect(detectLanguage('How do I find the gradient of a line?')).toBe('english')
  })

  it('returns "shona" when shona score strictly exceeds ndebele score', () => {
    // "ndinoda" and "mhoro" are Shona; "njani" is Ndebele — Shona wins 2:1
    expect(detectLanguage('mhoro ndinoda kubatsirwa njani')).toBe('shona')
  })

  it('returns "english" for an empty string', () => {
    expect(detectLanguage('')).toBe('english')
  })
})

describe('isOfflineReady', () => {
  it('returns false before initOfflineModel is called', () => {
    // The module-level modelReady flag starts false in a fresh Node environment.
    expect(isOfflineReady()).toBe(false)
  })
})
