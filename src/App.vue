<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AdminLayout from "@/views/Admin/AdminLayout.vue";
import UserLayout from "@/views/User/UserLayout.vue";

const route = useRoute();

// Check route path to determine layout
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin');
});

// Auth pages (no layout needed)
const isAuthPage = computed(() => {
  const authRoutes = ['/signin', '/signup', '/admin-signin'];
  return authRoutes.includes(route.path);
});
</script>

<template>
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
</template>