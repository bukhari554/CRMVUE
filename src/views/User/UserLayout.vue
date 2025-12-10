<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
<<<<<<< HEAD
//import UserNavbar from "@/views/User/components/UserNavbar.vue";
import AppHeader from "@/views/User/components/Header.vue";
=======
import UserSidenav from "@/views/User/Sidenav";
import UserNavbar from "@/views/User/components/UserNavbar.vue";
import Configurator from "@/examples/Configurator.vue";
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70

const store = useStore();

const isNavFixed = computed(() => store.state.isNavFixed);
const darkMode = computed(() => store.state.darkMode);
const isAbsolute = computed(() => store.state.isAbsolute);
<<<<<<< HEAD
const showNavbar = computed(() => store.state.showNavbar);
const layout = computed(() => store.state.layout);

=======
const showSidenav = computed(() => store.state.showSidenav);
const showNavbar = computed(() => store.state.showNavbar);
const layout = computed(() => store.state.layout);
const showConfig = computed(() => store.state.showConfig);
const hideConfigButton = computed(() => store.state.hideConfigButton);

const toggleConfigurator = () => store.commit("toggleConfigurator");
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70

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

<<<<<<< HEAD
    <!-- Main Content -->
    <main class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
      <AppHeader />
=======
    <!-- User Sidenav -->
    <UserSidenav v-if="showSidenav" />

    <!-- Main Content -->
    <main class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
      
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
      <!-- User Navbar -->
      <UserNavbar v-if="showNavbar" :class="[navClasses]" />

      <!-- Page Content (slot) -->
      <slot />
<<<<<<< HEAD
=======

      <!-- Configurator -->
      <Configurator 
        :toggle="toggleConfigurator" 
        :class="[showConfig ? 'show' : '', hideConfigButton ? 'd-none' : '']" 
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
      />
    </main>
  </div>
</template>

<style scoped>
.user-layout {
<<<<<<< HEAD

=======
  /* User specific styles if needed */
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
}
</style>