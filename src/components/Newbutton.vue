<script setup>
import { computed } from 'vue';
import { generateButtonStyles } from '@/utils/themeHelpers.js';

const props = defineProps({
  variant: {
    type: String,
    default: 'solid',
    validator: (value) => ['solid', 'gradient', 'outline', 'ghost', 'link'].includes(value)
  },
  color: {
    type: String,
    default: 'primary',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  rounded: {
    type: String,
    default: 'md',
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  customClass: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['click']);

const buttonStyles = computed(() => {
  const styles = generateButtonStyles({
    variant: props.variant,
    color: props.color,
    size: props.size,
    rounded: props.rounded,
    fullWidth: props.fullWidth,
  });

  if (props.disabled || props.loading) {
    styles.opacity = '0.6';
    styles.cursor = 'not-allowed';
    styles.pointerEvents = 'none';
  }

  return styles;
});

const buttonClasses = computed(() => {
  return [
    'theme-button',
    props.customClass
  ].filter(Boolean).join(' ');
});

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :class="buttonClasses"
    :style="buttonStyles"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <i v-if="loading" class="fas fa-spinner fa-spin me-2"></i>
    <slot></slot>
  </button>
</template>

<style scoped>
.theme-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  text-align: center;
  white-space: nowrap;
  user-select: none;
}

.theme-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-button:not(:disabled):active {
  transform: translateY(0);
}
</style>