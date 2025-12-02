<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
const isNavFixed = computed(() => store.state.isNavFixed);

defineProps({
  currentPage: {
    type: String,
    default: "",
  },
  currentDirectory: {
    type: String,
    default: "",
  },
});
</script>
<template>
  <nav aria-label="breadcrumb">
    <h5
      class="mb-0 font-weight-bolder px-0 pt-1 pb-0 mb-0"
      :class="isNavFixed ? 'text-dark' : 'text-white'"
    >
      {{ currentPage }}
    </h5>
  </nav>
</template>
