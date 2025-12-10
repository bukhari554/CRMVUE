<script setup>
defineProps({
  color: {
    type: String,
    default: "success",
  },
  size: {
    type: String,
    default: "md",
  },
  variant: {
    type: String,
    default: "fill",
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
});
const getClasses = (variant, color, size, fullWidth, active) => {
  let colorValue, sizeValue, fullWidthValue, activeValue;

  // Setting the button variant and color
  if (variant === "gradient") {
    colorValue = `bg-gradient-${color}`;
  } else if (variant === "outline") {
    colorValue = `btn-outline-${color}`;
  } else {
    colorValue = `btn-${color}`;
  }

  sizeValue = size ? `btn-${size}` : null;

  fullWidthValue = fullWidth ? `w-100` : null;

  activeValue = active ? `active` : null;

  return `${colorValue} ${sizeValue} ${fullWidthValue} ${activeValue}`;
};
</script>
<template>
  <button
    class="btn mb-0"
    :class="getClasses(variant, color, size, fullWidth, active)"
  >
    <slot />
  </button>
</template>

<style scoped>
/* Override gradient for success buttons - make them solid black with white text */
.btn.bg-gradient-success {
  background: #000000 !important;
  background-image: none !important;
  color: #ffffff !important;
  border-color: #000000 !important;
}

.btn.bg-gradient-success:hover,
.btn.bg-gradient-success:focus,
.btn.bg-gradient-success:active {
  background: #1a1a1a !important;
  background-image: none !important;
  color: #ffffff !important;
  border-color: #1a1a1a !important;
}
</style>