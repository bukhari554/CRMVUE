<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { APP_CONFIG } from '@/Data/appConfig.js'; 
import UserNavbar from "@/views/User/components/UserNavbar.vue";
import Balance from "@/views/User/components/Balance.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();

const logoUrl = computed(() => {
  const isDark = store.state.darkMode;
  
  if (store.state.logoUrl) {
    return store.state.logoUrl;
  }
  
  return isDark ? APP_CONFIG.companyLogoDark : APP_CONFIG.companyLogoLight;
});

// Check if current route is user route
const isUserRoute = computed(() => {
  return route.path.startsWith('/user');
});

// Handle deposit button click - redirect to wallet deposit page
const handleDepositClick = () => {
  router.push('/user/wallet?tab=deposit');
};
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
       <div class="spacer"></div> 
        <div class="button-group">
          <!-- Only show wallet on user routes -->
          <Balance v-if="isUserRoute" />
          
          <button v-if="isUserRoute" class="deposit-button" @click="handleDepositClick"> 
            Deposit
          </button>
        </div>
      </div>
      
      <div class="navbar-section">
        <UserNavbar />
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
  height: 85px;
  width: auto;
  object-fit: contain;
}

.button-group {
  position: absolute;
  bottom: 2rem; 
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.deposit-button {
  background-color: #111111;
  color: white;
  font-weight: 600;
  padding: 0.625rem 2rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 1rem;
}

.deposit-button:hover {
  background-color: #595959;
}

.navbar-section {
  width: 100%;
  background-color: #e5e5e5;
  padding-top: 0rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 1rem;
}

/* Mobile: Make buttons smaller, keep logo unchanged */
@media (max-width: 991px) {
  .deposit-button {
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
  }

  .button-group {
    gap: 0.5rem;
  }
}

@media (max-width: 576px) {
  .deposit-button {
    padding: 0.4rem 1rem;
    font-size: 0.8125rem;
  }

  .button-group {
    gap: 0.4rem;
  }
}
</style>