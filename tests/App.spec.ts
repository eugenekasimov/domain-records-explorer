import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import App from '../src/App.vue'
import DomainFilters from '../src/components/DomainFilters.vue'
import type { DomainRecord } from '../src/types/domain'

const sampleDomain: DomainRecord = {
  domain: 'example.com',
  registrar: 'Registrar Inc',
  status: 'active',
  created_at: '2020-01-01T00:00:00Z',
  expires_at: '2030-01-01T00:00:00Z',
  nameservers: ['ns1.example.com'],
  updated_at: '2024-01-01T00:00:00Z',
}

// State is created once in the factory and shared across tests.
// Refs are Vue-reactive so component templates respond to .value mutations.
// Reset in beforeEach to prevent cross-test pollution.
vi.mock('../src/composables/useDomainRecords', () => {
  const state = {
    filters: ref({ domain: '', registrar: '', status: '' as '' | 'active' | 'clientHold' | 'pendingTransfer' }),
    domains: ref([] as DomainRecord[]),
    isLoading: ref(false),
    error: ref(null as string | null),
    page: ref(1),
    pageSize: ref(10),
    total: ref(0),
    goToPreviousPage: vi.fn(),
    goToNextPage: vi.fn(),
    reload: vi.fn(),
    resetFilters: vi.fn(),
  }
  return { useDomainRecords: () => state }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getState(): Promise<any> {
  const { useDomainRecords } = await import('../src/composables/useDomainRecords')
  return (useDomainRecords as any)()
}

describe('App', () => {
  beforeEach(async () => {
    const s = await getState()
    s.domains.value = [sampleDomain]
    s.isLoading.value = false
    s.error.value = null
    s.page.value = 1
    s.pageSize.value = 10
    s.total.value = 1
    s.reload.mockClear()
    s.resetFilters.mockClear()
    s.goToNextPage.mockClear()
    s.goToPreviousPage.mockClear()
  })

  // --- Layout ---

  it('renders header and three layout panels', () => {
    const wrapper = mount(App)
    expect(wrapper.find('h1.app-title').text()).toBe('Domain Records Explorer')
    expect(wrapper.find('.panel-filters').exists()).toBe(true)
    expect(wrapper.find('.panel-table').exists()).toBe(true)
    expect(wrapper.find('.panel-details').exists()).toBe(true)
  })

  // --- Loading state ---

  it('shows loading overlay and hides table when isLoading is true', async () => {
    const s = await getState()
    s.isLoading.value = true

    const wrapper = mount(App)
    expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading domain records…')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  // --- Error state ---

  it('shows error message and Retry button scoped inside the error block', async () => {
    const s = await getState()
    s.error.value = 'Network failure'
    s.domains.value = []
    s.total.value = 0

    const wrapper = mount(App)
    const errorBlock = wrapper.find('.state-error')
    expect(errorBlock.exists()).toBe(true)
    expect(errorBlock.text()).toContain('Network failure')
    // Scoped to the error block — guards against selecting an unrelated button
    expect(errorBlock.find('button').text()).toBe('Retry')
  })

  it('calls reload when Retry is clicked', async () => {
    const s = await getState()
    s.error.value = 'Oops'
    s.domains.value = []
    s.total.value = 0

    const wrapper = mount(App)
    s.reload.mockClear() // discard the onMounted call
    await wrapper.find('.state-error button').trigger('click')
    expect(s.reload).toHaveBeenCalledOnce()
  })

  // --- Empty state ---

  it('shows empty state when there are no results and no error', async () => {
    const s = await getState()
    s.domains.value = []
    s.total.value = 0

    const wrapper = mount(App)
    expect(wrapper.find('.state-empty').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  // --- Results ---

  it('renders the domain table when results are present', () => {
    const wrapper = mount(App)
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('example.com')
  })

  // --- Pagination ---

  it('hides pagination when all results fit on one page', () => {
    // total=1, pageSize=10 → single page
    const wrapper = mount(App)
    expect(wrapper.find('.pagination').exists()).toBe(false)
  })

  it('shows pagination when results span multiple pages', async () => {
    const s = await getState()
    s.total.value = 25 // ceil(25/10) = 3 pages

    const wrapper = mount(App)
    expect(wrapper.find('.pagination').exists()).toBe(true)
  })

  it('disables Previous button on page 1', async () => {
    const s = await getState()
    s.total.value = 25
    s.page.value = 1

    const wrapper = mount(App)
    const prev = wrapper.findAll('.pagination-button').find(b => b.text() === 'Previous')
    expect(prev!.attributes('disabled')).toBeDefined()
  })

  it('disables Next button on the last page', async () => {
    const s = await getState()
    s.total.value = 25
    s.page.value = 3 // last page

    const wrapper = mount(App)
    const next = wrapper.findAll('.pagination-button').find(b => b.text() === 'Next')
    expect(next!.attributes('disabled')).toBeDefined()
  })

  it('calls goToNextPage when Next is clicked', async () => {
    const s = await getState()
    s.total.value = 25

    const wrapper = mount(App)
    const next = wrapper.findAll('.pagination-button').find(b => b.text() === 'Next')
    await next!.trigger('click')
    expect(s.goToNextPage).toHaveBeenCalledOnce()
  })

  it('calls goToPreviousPage when Previous is clicked', async () => {
    const s = await getState()
    s.total.value = 25
    s.page.value = 2

    const wrapper = mount(App)
    const prev = wrapper.findAll('.pagination-button').find(b => b.text() === 'Previous')
    await prev!.trigger('click')
    expect(s.goToPreviousPage).toHaveBeenCalledOnce()
  })

  // --- Row selection / details panel ---

  it('shows domain details when a table row is clicked', async () => {
    const wrapper = mount(App)
    await wrapper.find('tbody tr').trigger('click')
    await nextTick()
    expect(wrapper.find('.details-domain').text()).toBe('example.com')
  })

  it('clears selection when the details close button is clicked', async () => {
    const wrapper = mount(App)
    await wrapper.find('tbody tr').trigger('click')
    await nextTick()

    await wrapper.find('.details-close').trigger('click')
    await nextTick()
    expect(wrapper.find('.details-empty').exists()).toBe(true)
  })

  // --- Watch: stale selection ---

  it('clears selection when the selected domain is removed from results', async () => {
    const s = await getState()
    const wrapper = mount(App)

    await wrapper.find('tbody tr').trigger('click')
    await nextTick()
    expect(wrapper.find('.details-domain').exists()).toBe(true)

    // Simulate a filter change that removes the domain from results
    s.domains.value = []
    await nextTick()
    expect(wrapper.find('.details-empty').exists()).toBe(true)
  })

  // --- Reset ---

  it('calls resetFilters and clears selection when filters emit reset', async () => {
    const s = await getState()
    const wrapper = mount(App)

    await wrapper.find('tbody tr').trigger('click')
    await nextTick()
    expect(wrapper.find('.details-domain').exists()).toBe(true)

    wrapper.findComponent(DomainFilters).vm.$emit('reset')
    await nextTick()
    expect(s.resetFilters).toHaveBeenCalledOnce()
    expect(wrapper.find('.details-empty').exists()).toBe(true)
  })
})
