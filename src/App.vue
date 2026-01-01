<script setup>
import { computed, ref, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import AdminLayout from "@/views/Admin/AdminLayout.vue";
import UserLayout from "@/views/User/UserLayout.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const route = useRoute();
const router = useRouter();

// Loading states
const isInitialLoading = ref(true);
const isRouteChanging = ref(false);

// Check route path to determine layout
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin');
});

// Auth pages (no layout needed)
const isAuthPage = computed(() => {
  const authRoutes = ['/signin', '/signup', '/admin-signin'];
  return authRoutes.includes(route.path);
});

// Get loading message based on route
const loadingMessage = computed(() => {
  if (isAdminRoute.value) {
    return 'Loading Admin Panel...';
  } else if (isAuthPage.value) {
    return 'Loading...';
  } else {
    return 'Loading...';
  }
});

// Initial loading (page refresh ya first time load)
onMounted(async () => {
  // Wait for DOM to be ready
  await nextTick();
  
  // Minimum loading time for smooth UX (500ms)
  setTimeout(() => {
    isInitialLoading.value = false;
  }, 500);
});

// Router navigation guards for loading state
router.beforeEach((to, from, next) => {
  // Agar route change ho raha hai toh loading show karo
  if (from.name) {
    isRouteChanging.value = true;
  }
  next();
});

router.afterEach(() => {
  // Route change complete hone ke baad loading hide karo
  setTimeout(() => {
    isRouteChanging.value = false;
  }, 300);
});

// Alternative: Watch route changes (agar router guards use nahi kar sakte)
// watch(() => route.path, (newPath, oldPath) => {
//   if (oldPath) {
//     isRouteChanging.value = true;
//     setTimeout(() => {
//       isRouteChanging.value = false;
//     }, 300);
//   }
// });
</script>

<template>
  <!-- Initial Loading Screen (Full screen, jab page refresh ho) -->
  <Transition name="fade">
    <div 
      v-if="isInitialLoading" 
      class="loading-screen"
    >
      <div class="loading-content">
        <LoadingSpinner :message="loadingMessage" />
      </div>
    </div>
  </Transition>

  <!-- Route Change Loading (Top progress bar style) -->
  <Transition name="slide-down">
    <div 
      v-if="!isInitialLoading && isRouteChanging"
      class="route-loading-bar"
    >
      <div class="loading-bar-progress"></div>
    </div>
  </Transition>

  <!-- Main Content -->
  <Transition name="fade" mode="out-in">
    <div v-if="!isInitialLoading" key="main-content">
      <!-- Auth pages - No layout -->
      <router-view v-if="isAuthPage" />
      
      <!-- Admin Layout -->
      <AdminLayout v-else-if="isAdminRoute">
        <router-view />
      </AdminLayout>
      
      <!-- User Layout -->
      <UserLayout v-else>
        <router-view />
      </UserLayout>
    </div>
  </Transition>
</template>

<style scoped>
/* ==================== Loading Screen ==================== */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

/* ==================== Route Change Loading Bar ==================== */
.route-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: rgba(130, 214, 22, 0.2);
  z-index: 9998;
  overflow: hidden;
}

.loading-bar-progress {
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%,
    #82d616 50%,
    transparent 100%
  );
  animation: loading-progress 1.5s ease-in-out infinite;
  width: 50%;
}

@keyframes loading-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}

/* ==================== Transitions ==================== */
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(-100%);
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .route-loading-bar {
    height: 2px;
  }
}
</style>