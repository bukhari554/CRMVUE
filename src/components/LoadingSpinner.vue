<script setup>
defineProps({
  message: {
    type: String,
    default: 'Loading...',
  },
  size: {
    type: String,
    default: 'lg', // sm, md, lg
  },
});
</script>

<template>
  <div class="text-center text-muted py-5">
    <i 
      class="fas fa-spinner fa-spin mb-3"
      :class="{
        'fa-2x': size === 'lg',
        'fa-lg': size === 'md',
        'fa-sm': size === 'sm',
      }"
    ></i>
    <p class="mb-0">{{ message }}</p>
  </div>
</template>

<style scoped>
/* Loading spinner styles */
</style>

