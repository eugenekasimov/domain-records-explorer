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

  const load = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetchDomains({
        ...filters.value,
        page: page.value,
        pageSize: pageSize.value,
      });
      domains.value = response.data;
      total.value = response.total;
    } catch (e) {
      console.error(e);
      error.value = "Failed to load domain records.";
      domains.value = [];
      total.value = 0;
    } finally {
      isLoading.value = false;
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

  const setPage = (targetPage: number) => {
    if (targetPage < 1) return;
    page.value = targetPage;
    void load();
  };

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
    page.value = 1;
    void load();
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
    setPage,
    goToPreviousPage,
    goToNextPage,
    resetFilters,
  };
}
