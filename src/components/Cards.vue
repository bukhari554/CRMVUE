<script setup>
import { computed } from 'vue';
import { generateCardStyles } from '@/utils/themeHelpers.js';

const props = defineProps({
  // Card variants
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'gradient', 'bordered', 'shadow', 'flat'].includes(value)
  },
  
  // Border radius
  rounded: {
    type: String,
    default: 'lg',
  },
  
  // Shadow
  shadow: {
    type: String,
    default: 'sm',
  },
  
  // Padding
  padding: {
    type: String,
    default: 'lg',
  },
  
  // Background color/gradient
  color: {
    type: String,
    default: 'white'
  },
  
  // Border color (for bordered variant)
  borderColor: {
    type: String,
    default: '#e9ecef'
  },
  
  // Hover effect
  hoverable: {
    type: Boolean,
    default: false
  },
  
  // Full height
  fullHeight: {
    type: Boolean,
    default: false
  },
  
  // Custom class
  customClass: {
    type: String,
    default: ''
  },

  // Header class
  headerClass: {
    type: String,
    default: ''
  },

  // Body class
  bodyClass: {
    type: String,
    default: ''
  },

  // Footer class
  footerClass: {
    type: String,
    default: ''
  }
});

const cardStyles = computed(() => {
  return generateCardStyles({
    variant: props.variant,
    rounded: props.rounded,
    shadow: props.shadow,
    padding: props.padding,
    color: props.color,
    borderColor: props.borderColor,
    fullHeight: props.fullHeight,
  });
});

const cardClasses = computed(() => {
  return [
    'theme-card',
    props.hoverable ? 'theme-card--hoverable' : '',
    props.customClass
  ].filter(Boolean).join(' ');
});
</script>

<template>
  <div :class="cardClasses" :style="cardStyles">
    <!-- Header Slot -->
    <div v-if="$slots.header" class="theme-card__header" :class="headerClass">
      <slot name="header"></slot>
    </div>

    <!-- Body Slot -->
    <div class="theme-card__body" :class="bodyClass">
      <slot></slot>
    </div>

    <!-- Footer Slot -->
    <div v-if="$slots.footer" class="theme-card__footer" :class="footerClass">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.theme-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
}

.theme-card--hoverable {
  cursor: pointer;
}

.theme-card--hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
}

.theme-card__header {
  flex-shrink: 0;
}

.theme-card__body {
  flex: 1 1 auto;
}

.theme-card__footer {
  flex-shrink: 0;
  margin-top: auto;
}
</style>