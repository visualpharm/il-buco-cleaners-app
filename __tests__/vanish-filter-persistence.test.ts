import { describe, test, expect, beforeEach } from '@jest/globals'
import { CLEANER_STORAGE_KEYS } from '../lib/cleaners'

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// @ts-ignore
global.localStorage = localStorageMock

describe('Vanish Filter Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  test('should save cleaner filter to localStorage', () => {
    const cleanerId = 'ivan'
    localStorage.setItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER, cleanerId)
    
    const saved = localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER)
    expect(saved).toBe(cleanerId)
  })

  test('should save period filter to localStorage', () => {
    const period = '90'
    localStorage.setItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_PERIOD, period)
    
    const saved = localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_PERIOD)
    expect(saved).toBe(period)
  })

  test('should remove cleaner filter when set to empty', () => {
    // First set a value
    localStorage.setItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER, 'ivan')
    expect(localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER)).toBe('ivan')
    
    // Then remove it
    localStorage.removeItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER)
    expect(localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER)).toBeNull()
  })

  test('should persist both filters independently', () => {
    const cleanerId = 'melody'
    const period = '365'
    
    localStorage.setItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER, cleanerId)
    localStorage.setItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_PERIOD, period)
    
    expect(localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER)).toBe(cleanerId)
    expect(localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_PERIOD)).toBe(period)
    
    // Remove one, other should remain
    localStorage.removeItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER)
    expect(localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_CLEANER)).toBeNull()
    expect(localStorage.getItem(CLEANER_STORAGE_KEYS.VANISH_FILTER_PERIOD)).toBe(period)
  })
})