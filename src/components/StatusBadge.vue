<script setup lang="ts">
import { computed } from "vue";
import type { DomainStatus } from "../types/domain";

const props = defineProps<{
  status: DomainStatus | string;
}>();

const label = computed(() => {
  if (props.status === "active") return "Active";
  if (props.status === "clientHold") return "Client hold";
  if (props.status === "pendingTransfer") return "Pending transfer";
  return `Unknown status (${props.status})`;
});
</script>

<template>
  <span :class="['status-badge', `status-${status}`]">
    <span class="status-dot" />
    <span class="status-text">
      {{ label }}
    </span>
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.1rem 0.6rem 0.15rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
}

.status-text {
  text-transform: capitalize;
}

.status-active {
  background-color: #ecfdf3;
  color: #166534;
}

.status-active .status-dot {
  background-color: #16a34a;
}

.status-clientHold {
  background-color: #fffbeb;
  color: #92400e;
}

.status-clientHold .status-dot {
  background-color: #eab308;
}

.status-pendingTransfer {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.status-pendingTransfer .status-dot {
  background-color: #3b82f6;
}
</style>

