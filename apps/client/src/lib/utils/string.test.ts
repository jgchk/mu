// Replace with your actual module path
import { describe, expect, it } from 'vitest'

import { sortBySimilarity } from './string'

describe('sortBySimilarity Tests', () => {
  it('should correctly sort strings based on distance to query', () => {
    const strings = ['apple', 'app', 'banana', 'grape']
    const query = 'ape'
    const sorted = sortBySimilarity(strings, query)
    expect(sorted).toEqual(['app', 'apple', 'grape', 'banana'])
  })

  it('should be case insensitive', () => {
    const strings = ['Apple', 'apple', 'Banana', 'banana']
    const query = 'apple'
    const sorted = sortBySimilarity(strings, query)
    expect(sorted).toEqual(['Apple', 'apple', 'Banana', 'banana'])
  })

  it('should handle empty strings', () => {
    const strings = ['', 'apple', '']
    const query = 'apple'
    const sorted = sortBySimilarity(strings, query)
    expect(sorted).toEqual(['apple', '', ''])
  })

  it('should handle special characters', () => {
    const strings = ['@pple', 'apple!', '#banana']
    const query = 'apple'
    const sorted = sortBySimilarity(strings, query)
    expect(sorted).toEqual(['@pple', 'apple!', '#banana'])
  })

  it('should handle an empty array', () => {
    const strings: string[] = []
    const query = 'apple'
    const sorted = sortBySimilarity(strings, query)
    expect(sorted).toEqual([])
  })

  // Optional: Test with a large data set
  it('should perform efficiently with a large array', () => {
    const largeArray = Array(10000).map((_, i) => `string${i}`)
    const query = 'string'
    // You might want to measure execution time or simply check that it completes
    const sorted = sortBySimilarity(largeArray, query)
    expect(sorted.length).toEqual(10000)
  })
})
