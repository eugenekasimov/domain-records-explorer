import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useDomainRecords } from '../src/composables/useDomainRecords'
import * as api from '../src/api/domainApi'

const samplePage = {
  data: [
    {
      domain: 'example.com',
      registrar: 'Acme',
      status: 'active',
      created_at: '2020-01-01T00:00:00Z',
      expires_at: '2030-01-01T00:00:00Z',
      nameservers: [],
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
}

describe('useDomainRecords', () => {
  const mockFetch = vi.spyOn(api, 'fetchDomains')

  beforeEach(() => {
    mockFetch.mockReset()
  })


  it('loads domains when load is called', async () => {
    mockFetch.mockResolvedValueOnce(samplePage)

    const composable = useDomainRecords()
    await composable.reload()
    await flushPromises()

    expect(composable.isLoading.value).toBe(false)
    expect(composable.error.value).toBeNull()
    expect(composable.domains.value).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalled()
  })

  it('sets error state when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const composable = useDomainRecords()
    await composable.reload()
    await flushPromises()

    expect(composable.error.value).toBeTruthy()
    expect(composable.domains.value).toHaveLength(0)
  })

  it('handles empty result', async () => {
    mockFetch.mockResolvedValueOnce({ data: [], total: 0 })

    const composable = useDomainRecords()
    await composable.reload()
    await flushPromises()

    expect(composable.domains.value).toHaveLength(0)
    expect(composable.total.value).toBe(0)
    expect(composable.error.value).toBeNull()
  })

  it('filter change triggers load immediately', async () => {
    mockFetch.mockResolvedValue(samplePage)

    const composable = useDomainRecords()
    await composable.reload()
    await flushPromises()
    mockFetch.mockClear()

    composable.filters.value = { ...composable.filters.value, domain: 'test' }
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ domain: 'test', page: 1 })
    )
  })

  it('resetFilters clears non-empty filters and triggers load immediately', async () => {
    mockFetch.mockResolvedValue(samplePage)

    const composable = useDomainRecords()
    await composable.reload()
    await flushPromises()

    composable.filters.value = {
      domain: 'example',
      registrar: 'Acme',
      status: 'active',
    }
    await flushPromises()
    expect(composable.filters.value.domain).toBe('example')
    mockFetch.mockClear()

    composable.resetFilters()
    await flushPromises()

    expect(composable.filters.value).toEqual({})
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    )
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]?.[0]
    expect(lastCall?.domain).toBeUndefined()
    expect(lastCall?.registrar).toBeUndefined()
    expect(lastCall?.status).toBeUndefined()
  })

  it('pagination: goToNextPage calls fetch with correct page', async () => {
    mockFetch.mockResolvedValue({ data: [], total: 25 })

    const composable = useDomainRecords()
    await composable.reload()
    await flushPromises()
    expect(composable.total.value).toBe(25)
    mockFetch.mockClear()

    composable.goToNextPage()
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10 })
    )
    expect(composable.page.value).toBe(2)

    mockFetch.mockClear()
    composable.goToNextPage()
    await flushPromises()
    expect(composable.page.value).toBe(3)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3 })
    )
  })

  it('stale response is discarded when a newer request supersedes it', async () => {
    let resolveFirst!: (v: { data: never[]; total: number }) => void
    let resolveSecond!: (v: { data: never[]; total: number }) => void

    const firstPage = { data: [], total: 10 }
    const secondPage = { data: [], total: 99 }

    mockFetch
      .mockReturnValueOnce(new Promise((r) => { resolveFirst = r }))
      .mockReturnValueOnce(new Promise((r) => { resolveSecond = r }))

    const composable = useDomainRecords()

    // Fire two loads without waiting for the first to finish
    void composable.reload()
    void composable.reload()

    // Resolve the first (stale) request after the second has been registered
    resolveFirst(firstPage)
    await flushPromises()

    // Stale result must not overwrite state
    expect(composable.total.value).not.toBe(10)

    // Now resolve the second (current) request
    resolveSecond(secondPage)
    await flushPromises()

    expect(composable.total.value).toBe(99)
    expect(composable.isLoading.value).toBe(false)
  })

  it('goToPreviousPage decrements page and loads', async () => {
    mockFetch.mockResolvedValue({ data: [], total: 25 })

    const composable = useDomainRecords()
    await composable.reload()
    await flushPromises()
    composable.goToNextPage()
    await flushPromises()
    composable.goToNextPage()
    await flushPromises()
    expect(composable.page.value).toBe(3)
    mockFetch.mockClear()

    composable.goToPreviousPage()
    await flushPromises()
    expect(composable.page.value).toBe(2)
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
  })
})

