import { renderHook, act } from '@testing-library/react'
import { useSearchCache } from '../useSearchCache'

// Mock fetch
global.fetch = jest.fn()

describe('useSearchCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any cached data
    localStorage.clear()
  })

  const mockSearchResults = [
    { id: 1, name: '테스트 시설 1', lat: 37.5665, lng: 126.9780 },
    { id: 2, name: '테스트 시설 2', lat: 37.5670, lng: 126.9785 }
  ]

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSearchCache())
    
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.query).toBe('')
  })

  it('searches and caches results', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockSearchResults })
    })
    
    const { result } = renderHook(() => useSearchCache())
    
    await act(async () => {
      await result.current.search('테스트')
    })
    
    expect(result.current.results).toEqual(mockSearchResults)
    expect(result.current.loading).toBe(false)
    expect(result.current.query).toBe('테스트')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/search'),
      expect.objectContaining({
        method: 'GET'
      })
    )
  })

  it('returns cached results for same query', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockSearchResults })
    })
    
    const { result } = renderHook(() => useSearchCache())
    
    // First search
    await act(async () => {
      await result.current.search('테스트')
    })
    
    // Second search with same query
    await act(async () => {
      await result.current.search('테스트')
    })
    
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result.current.results).toEqual(mockSearchResults)
  })

  it('makes new request for different query', async () => {
    const mockResults2 = [{ id: 3, name: '다른 시설', lat: 37.5600, lng: 126.9700 }]
    
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockSearchResults })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockResults2 })
      })
    
    const { result } = renderHook(() => useSearchCache())
    
    // First search
    await act(async () => {
      await result.current.search('테스트')
    })
    
    // Second search with different query
    await act(async () => {
      await result.current.search('다른')
    })
    
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(result.current.results).toEqual(mockResults2)
    expect(result.current.query).toBe('다른')
  })

  it('handles search errors', async () => {
    const errorMessage = 'Search failed'
    ;(fetch as jest.Mock).mockRejectedValue(new Error(errorMessage))
    
    const { result } = renderHook(() => useSearchCache())
    
    await act(async () => {
      await result.current.search('테스트')
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toEqual(expect.objectContaining({
      message: errorMessage
    }))
    expect(result.current.results).toEqual([])
  })

  it('sets loading state during search', async () => {
    let resolveSearch: (value: any) => void
    const searchPromise = new Promise(resolve => {
      resolveSearch = resolve
    })
    
    ;(fetch as jest.Mock).mockReturnValue(searchPromise)
    
    const { result } = renderHook(() => useSearchCache())
    
    act(() => {
      result.current.search('테스트')
    })
    
    expect(result.current.loading).toBe(true)
    
    await act(async () => {
      resolveSearch({
        ok: true,
        json: async () => ({ results: mockSearchResults })
      })
      await searchPromise
    })
    
    expect(result.current.loading).toBe(false)
  })

  it('clears results', () => {
    const { result } = renderHook(() => useSearchCache())
    
    // Set some initial state
    act(() => {
      result.current.search('테스트')
    })
    
    act(() => {
      result.current.clearResults()
    })
    
    expect(result.current.results).toEqual([])
    expect(result.current.query).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('debounces search requests', async () => {
    jest.useFakeTimers()
    
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockSearchResults })
    })
    
    const { result } = renderHook(() => useSearchCache({ debounceMs: 300 }))
    
    // Rapid fire searches
    act(() => {
      result.current.search('테')
    })
    
    act(() => {
      result.current.search('테스')
    })
    
    act(() => {
      result.current.search('테스트')
    })
    
    // Advance timers but not enough to trigger debounce
    jest.advanceTimersByTime(200)
    expect(fetch).not.toHaveBeenCalled()
    
    // Advance past debounce delay
    jest.advanceTimersByTime(200)
    
    await act(async () => {
      await Promise.resolve()
    })
    
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result.current.query).toBe('테스트')
    
    jest.useRealTimers()
  })

  it('respects cache expiry time', async () => {
    jest.useFakeTimers()
    
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockSearchResults })
    })
    
    const { result } = renderHook(() => useSearchCache({ cacheExpiryMs: 5000 }))
    
    // First search
    await act(async () => {
      await result.current.search('테스트')
    })
    
    // Advance time past cache expiry
    jest.advanceTimersByTime(6000)
    
    // Second search with same query should hit API again
    await act(async () => {
      await result.current.search('테스트')
    })
    
    expect(fetch).toHaveBeenCalledTimes(2)
    
    jest.useRealTimers()
  })

  it('handles empty search query', async () => {
    const { result } = renderHook(() => useSearchCache())
    
    await act(async () => {
      await result.current.search('')
    })
    
    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  it('handles whitespace-only query', async () => {
    const { result } = renderHook(() => useSearchCache())
    
    await act(async () => {
      await result.current.search('   ')
    })
    
    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })
})