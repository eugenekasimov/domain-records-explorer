import { ref, watch } from "vue";
import type { DomainRecord } from "../types/domain";
import { fetchDomains, type DomainFilterParams } from "../api/domainApi";

export function useDomainRecords(initialFilters: DomainFilterParams = {}) {
  const filters = ref<DomainFilterParams>({ ...initialFilters });
  const domains = ref<DomainRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  // Incremented on every load call. Stale responses (from superseded requests)
  // compare their captured ID against this and discard if they no longer match.
  let latestRequestId = 0;

  const load = async () => {
    const requestId = ++latestRequestId;
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetchDomains({
        ...filters.value,
        page: page.value,
        pageSize: pageSize.value,
      });
      if (requestId !== latestRequestId) return;
      domains.value = response.data;
      total.value = response.total;
    } catch (e) {
      if (requestId !== latestRequestId) return;
      // TODO: send error details to a real observability system instead of relying on UI-only messaging
      error.value = "Failed to load domain records.";
      domains.value = [];
      total.value = 0;
    } finally {
      if (requestId === latestRequestId) {
        isLoading.value = false;
      }
    }
  };

  watch(
    filters,
    () => {
      page.value = 1;
      void load();
    },
    { deep: true },
  );

  const goToPreviousPage = () => {
    if (page.value <= 1) return;
    page.value -= 1;
    void load();
  };

  const goToNextPage = () => {
    if (page.value * pageSize.value >= total.value) return;
    page.value += 1;
    void load();
  };

  const resetFilters = () => {
    filters.value = {};
    // Watcher runs and loads; no debounce so reset and status changes feel immediate
  };

  return {
    filters,
    domains,
    isLoading,
    error,
    page,
    pageSize,
    total,
    reload: load,
    goToPreviousPage,
    goToNextPage,
    resetFilters,
  };
}
