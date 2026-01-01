<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import AppHeader from "@/views/Admin/components/Header.vue"; // Ye add karein

const store = useStore();
const showSidenav = computed(() => store.state.showSidenav);
const layout = computed(() => store.state.layout);

const showConfig = computed(() => store.state.showConfig);
const hideConfigButton = computed(() => store.state.hideConfigButton);
const toggleConfigurator = () => store.commit("toggleConfigurator");

</script>

<template>
  <div class="admin-layout">

  <div
    v-show="layout === 'landing'"
    class="landing-bg h-100 bg-gradient-primary position-fixed w-100"
  ></div>

  <sidenav v-if="showSidenav" />

  <main
    class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
  >
    <AppHeader />

    <router-view />

    <configurator
      :toggle="toggleConfigurator"
      :class="[showConfig ? 'show' : '', hideConfigButton ? 'd-none' : '']"
    />
  </main>
</div>
</template>
<style scoped>
.admin-layout {
background-color:#e5e5e5 ;
}
.main {
  background-color: #e5e5e5;
}
</style>  