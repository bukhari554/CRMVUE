<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import AppHeader from "@/views/User/components/Header.vue";

const store = useStore();
const layout = computed(() => store.state.layout);
</script>

<template>
  <div class="user-layout">
    <!-- Landing background -->
    <div 
      v-show="layout === 'landing'" 
      class="landing-bg h-100 bg-gradient-primary position-fixed w-100"
    ></div>

    <!-- Main Content -->
    <main class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
      <div class="sticky-header">
        <AppHeader />
      </div>

      <!-- Page Content -->
      <div class="page-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.page-content {
  padding-top: 0;
}

.main-content {
  overflow-y: auto;
  /* Hide scrollbar by default, show on hover */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s ease;
}

.main-content:hover {
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

/* For Webkit browsers (Chrome, Safari, Edge) */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 10px;
  transition: background-color 0.3s ease;
}

.main-content:hover::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
}

.main-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Show scrollbar while scrolling */
.main-content::-webkit-scrollbar-thumb:active {
  background-color: rgba(0, 0, 0, 0.6);
}
</style>