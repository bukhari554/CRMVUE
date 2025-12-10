<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:activeTab']);

const tabs = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

const setActiveTab = (tabId) => {
  emit('update:activeTab', tabId);
};
</script>

<template>
  <div class="d-flex align-items-center gap-4 border-bottom pb-2" style="border-bottom: 1px solid #e9ecef !important;">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="setActiveTab(tab.id)"
      class="btn btn-link p-0 text-decoration-none border-0 position-relative"
      :class="{
        'text-dark fw-bold': activeTab === tab.id,
        'text-muted': activeTab !== tab.id,
      }"
      style="background: none; border: none;"
    >
      {{ tab.label }}
      <div
        v-if="activeTab === tab.id"
        class="position-absolute start-0"
        style="bottom: -10px; width: 100%; height: 2px; background-color: #344767;"
      ></div>
    </button>
  </div>
</template>

