<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
//import UserNavbar from "@/views/User/components/UserNavbar.vue";
import AppHeader from "@/views/User/components/Header.vue";

const store = useStore();

const isNavFixed = computed(() => store.state.isNavFixed);
const darkMode = computed(() => store.state.darkMode);
const isAbsolute = computed(() => store.state.isAbsolute);
const showNavbar = computed(() => store.state.showNavbar);
const layout = computed(() => store.state.layout);


const navClasses = computed(() => {
  return {
    "position-sticky bg-white left-auto top-2 z-index-sticky": isNavFixed.value && !darkMode.value,
    "position-sticky bg-default left-auto top-2 z-index-sticky": isNavFixed.value && darkMode.value,
    "position-absolute px-4 mx-0 w-100 z-index-2": isAbsolute.value,
    "px-0 mx-4": !isAbsolute.value,
  };
});
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
      <AppHeader />
      <!-- User Navbar -->
      <UserNavbar v-if="showNavbar" :class="[navClasses]" />

      <!-- Page Content (slot) -->
      <slot />
      />
    </main>
  </div>
</template>

<style scoped>
.user-layout {

}
</style>