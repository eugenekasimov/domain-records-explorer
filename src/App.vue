<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useDomainRecords } from "./composables/useDomainRecords";
import type { DomainRecord, DomainStatus } from "./types/domain";
import DomainFilters from "./components/DomainFilters.vue";
import DomainTable from "./components/DomainTable.vue";
import DomainDetails from "./components/DomainDetails.vue";

const {
  filters,
  domains,
  isLoading,
  error,
  reload,
  page,
  pageSize,
  total,
  goToPreviousPage,
  goToNextPage,
  resetFilters,
} = useDomainRecords();

const selectedDomain = ref<DomainRecord | null>(null);

const totalPages = computed(() =>
  total.value ? Math.ceil(total.value / pageSize.value) : 1,
);

const hasResults = computed(
  () => !isLoading.value && domains.value.length > 0 && !error.value,
);

const clearSelection = () => {
  selectedDomain.value = null;
};

const handleRowSelect = (domain: DomainRecord) => {
  selectedDomain.value = domain;
};

const handleStatusFilterChange = (status: DomainStatus | "") => {
  filters.value = { ...filters.value, status };
};

const handleReset = () => {
  clearSelection();
  resetFilters();
};

onMounted(() => {
  void reload();
});

watch(
  () => [domains.value, selectedDomain.value] as const,
  ([currentDomains, currentSelected]) => {
    if (
      currentSelected &&
      !currentDomains.some((d) => d.domain === currentSelected.domain)
    ) {
      clearSelection();
    }
  },
  { deep: false },
);
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div>
        <h1 class="app-title">Domain Records Explorer</h1>
        <p class="app-subtitle">
          Search, filter, and inspect domain records for support investigations.
        </p>
      </div>
    </header>

    <main class="app-main">
      <section class="panel panel-filters">
        <header class="panel-header">
          <h2 class="panel-title">Filters</h2>
        </header>
        <div class="panel-body">
          <DomainFilters
            v-model:domain="filters.domain"
            v-model:registrar="filters.registrar"
            :status="filters.status ?? ''"
            @update:status="handleStatusFilterChange"
            @reset="handleReset"
          />
        </div>
      </section>

      <section class="panel panel-table">
        <header class="panel-header">
          <h2 class="panel-title">Domains</h2>
          <p class="panel-meta">
            <span v-if="isLoading">Loading domain records…</span>
            <span v-else-if="error">{{ error }}</span>
            <span v-else-if="hasResults">
              {{ total }} domains · Page {{ page }} of {{ totalPages }}
            </span>
            <span v-else>No domains match your filters.</span>
          </p>
        </header>

        <div class="panel-body panel-body-table">
          <div v-if="isLoading" class="loading-overlay" aria-live="polite">
            <div class="spinner" aria-hidden="true" />
            <span>Loading domain records…</span>
          </div>

          <div v-else-if="error" class="state-message state-error" role="alert">
            <p>{{ error }}</p>
            <button type="button" class="secondary-button" @click="reload">
              Retry
            </button>
          </div>

          <div v-else-if="!domains.length" class="state-message state-empty">
            <p>No domains match your filters.</p>
            <p class="state-hint">
              Try adjusting domain, registrar, or status filters.
            </p>
          </div>

          <DomainTable
            v-else
            :domains="domains"
            :selected-domain="selectedDomain"
            @select="handleRowSelect"
          />

          <div
            v-if="!isLoading && !error && total > pageSize && totalPages > 1"
            class="pagination"
          >
            <button
              type="button"
              class="pagination-button"
              :disabled="page === 1"
              @click="goToPreviousPage"
            >
              Previous
            </button>
            <span class="pagination-info">
              Page {{ page }} of {{ totalPages }}
            </span>
            <button
              type="button"
              class="pagination-button"
              :disabled="page === totalPages"
              @click="goToNextPage"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <aside class="panel panel-details" aria-label="Domain details">
        <header class="panel-header">
          <h2 class="panel-title">Details</h2>
        </header>
        <div class="panel-body">
          <DomainDetails :domain="selectedDomain" @close="clearSelection" />
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f3f4f6;
  color: #111827;
}

.app-header {
  width: 100%;
  padding: 1.75rem 2rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.app-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.app-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  color: #4b5563;
}

.app-main {
  width: 100%;
  padding: 1.5rem 2rem 2.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 3.2fr) minmax(260px, 1.5fr);
  gap: 1.25rem;
  align-items: stretch;
}

.panel {
  background-color: #ffffff;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-filters {
  min-width: 0;
}

.panel-table {
  min-width: 0;
  height: 100%;
}

.panel-details {
  min-width: 0;
}

.panel-header {
  padding: 0.9rem 1rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.panel-title {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
}

.panel-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.panel-body {
  padding: 0.9rem 1rem 1rem;
  flex: 1;
  min-height: 0;
}

.panel-body-table {
  position: relative;
  padding: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
}

.pagination-info {
  font-size: 0.85rem;
  color: #6b7280;
}

.pagination-button {
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 0.25rem 0.85rem;
  font-size: 0.85rem;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.loading-overlay {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #6b7280;
}

.spinner {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 3px solid rgba(209, 213, 219, 0.9);
  border-top-color: #005fbb;
  animation: spin 0.8s linear infinite;
}

.state-message {
  padding: 1.1rem 1.25rem;
  font-size: 0.9rem;
  border-radius: 0.75rem;
}

.state-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1rem;
}

.state-empty {
  background-color: #f9fafb;
  border: 1px dashed #d1d5db;
  color: #111827;
}

.state-hint {
  margin-top: 0.35rem;
  color: #6b7280;
}

.secondary-button {
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.secondary-button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .app-main {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 2fr);
    grid-template-rows: auto auto;
  }

  .panel-details {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    padding-inline: 1.25rem;
  }

  .app-main {
    padding-inline: 1.25rem;
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
