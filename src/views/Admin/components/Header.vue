<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { APP_CONFIG } from '@/Data/appConfig.js'; 
import UserNavbar from "@/views/Admin/components/AdminNavbar.vue";

const store = useStore();

const logoUrl = computed(() => {
  const isDark = store.state.darkMode;
  
  if (store.state.logoUrl) {
    return store.state.logoUrl;
  }
  
  return isDark ? APP_CONFIG.companyLogoDark : APP_CONFIG.companyLogoLight;
});
</script>

<template>
  <div class="header-wrapper">
    <header>
      <div class="top-section">
        <div class="logo-container">
          <img 
            :src="logoUrl" 
            alt="Company Logo" 
            class="company-logo"
          />
        </div>
      </div> 
      <div class="navbar-section">
        <UserNavbar/>
      </div>
    </header>
  </div>
</template>

<style scoped>
.header-wrapper {
  width: 100%;
}

.main-header {
  width: 100%;
}

.top-section {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 1rem 2rem 2.5rem;
  background-color: #e5e5e5;
}

.logo-container {
  display: flex;
  align-items: center;
}

.company-logo {
  height: 100px;
  width: auto;
  object-fit: contain;
}

.navbar-section {
  width: 100%;
  background-color: #e5e5e5;
  padding-top: 0rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 1rem;
}
</style>