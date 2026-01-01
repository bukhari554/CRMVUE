<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const showSubmenu = ref(false);
const popupRef = ref(null);
const submenuTimeout = ref(null);
const props = defineProps({
  triggerElement: {
    type: [Object, null],
    default: null,
    required: false
  }
});

const emit = defineEmits(['mouseenter', 'mouseleave']);

const handleMouseEnter = () => {
  if (submenuTimeout.value) {
    clearTimeout(submenuTimeout.value);
    submenuTimeout.value = null;
  }
  emit('mouseenter');
};

const handleMouseLeave = (event) => {
  // Check if we're moving to the submenu
  const submenu = event.currentTarget?.querySelector('.popup-submenu-content');
  const relatedTarget = event.relatedTarget;
  
  // If moving to submenu, don't close
  if (submenu && relatedTarget && submenu.contains(relatedTarget)) {
    return;
  }
  
  // Add small delay before closing
  submenuTimeout.value = setTimeout(() => {
    emit('mouseleave');
    submenuTimeout.value = null;
  }, 150);
};

const handleSubmenuEnter = () => {
  if (submenuTimeout.value) {
    clearTimeout(submenuTimeout.value);
    submenuTimeout.value = null;
  }
  showSubmenu.value = true;
};

const handleSubmenuLeave = () => {
  submenuTimeout.value = setTimeout(() => {
    showSubmenu.value = false;
    submenuTimeout.value = null;
  }, 150);
};

const isActivePage = (routeName) => {
  return route.name === routeName;
};

const updatePosition = () => {
  // No need for manual positioning - using absolute positioning relative to parent
  // This function is kept for compatibility but doesn't need to do anything
};

watch(() => props.triggerElement, async () => {
  if (props.triggerElement && popupRef.value) {
    await nextTick();
    updatePosition();
  }
}, { immediate: false });

// Watch for popupRef to be set and update position
watch(() => popupRef.value, async () => {
  if (popupRef.value) {
    await nextTick();
    updatePosition();
  }
});

onMounted(async () => {
  await nextTick();
  updatePosition();
});

onUnmounted(() => {
  if (submenuTimeout.value) {
    clearTimeout(submenuTimeout.value);
  }
});
</script>

<template>
  <div
    ref="popupRef"
    class="information-tools-popup"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="popup-content">
      <!-- MetaTrader 5 Submenu -->
      <div 
        class="popup-item popup-submenu" 
        @mouseenter="handleSubmenuEnter" 
        @mouseleave="handleSubmenuLeave"
      >
        <a
          href="javascript:void(0)"
          class="popup-link d-flex align-items-center justify-content-between"
        >
          <span class="d-flex align-items-center">
            <i class="fa fa-desktop me-2"></i>
            MetaTrader 5
          </span>
          <i class="fa fa-chevron-right ms-2"></i>
        </a>
        <div 
          class="popup-submenu-content"
          :class="{ 'show': showSubmenu }"
          @mouseenter="handleSubmenuEnter"
          @mouseleave="handleSubmenuLeave"
        >
          <router-link
            to="/user/windowtrader"
            class="popup-link d-flex align-items-center"
            :class="{ 'active': isActivePage('WindowTrader') }"
          >
            <i class="fa fa-desktop me-2"></i>
            <span>MT5 TRADER (Windows)</span>
          </router-link>
          <router-link
            to="/user/mobiletrader"
            class="popup-link d-flex align-items-center"
            :class="{ 'active': isActivePage('MobileTrader') }"
          >
            <i class="fa fa-mobile-alt me-2"></i>
            <span>Mobile Trader (Android)</span>
          </router-link>
          <router-link
            to="/user/iostrader"
            class="popup-link d-flex align-items-center"
            :class="{ 'active': isActivePage('IOSTrader') }"
          >
            <i class="fa fa-mobile-alt me-2"></i>
            <span>Mobile Trader (iOS)</span>
          </router-link>
        </div>
      </div>
      <hr class="popup-divider" />
      <router-link
        to="/user/usefulltools"
        class="popup-link d-flex align-items-center"
        :class="{ 'active': isActivePage('UsefullTools') }"
      >
        <i class="fa fa-wrench me-2"></i>
        <span>Useful Tools</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.information-tools-popup {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  z-index: 9999 !important;
  min-width: 220px;
  margin-top: 0.5rem;
  animation: fadeIn 0.2s ease;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-content {
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  padding: 0.5rem 0;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.popup-item {
  position: relative;
}

.popup-link {
  padding: 0.5rem 1rem;
  color: #212529;
  transition: background-color 0.15s ease-in-out;
  text-decoration: none;
  display: block;
  width: 100%;
}

.popup-link:hover {
  background-color: #f8f9fa;
  color: #212529;
  text-decoration: none;
}

.popup-link.active {
  background-color: #000000;
  color: #ffffff;
}

.popup-link.active i {
  color: #ffffff;
}

.popup-divider {
  margin: 0.5rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  border-bottom: none;
}

/* Popup Submenu Styles */
.popup-submenu-content {
  position: absolute;
  left: 100%;
  top: 0;
  margin-top: 0;
  min-width: 220px;
  z-index: 1051;
  margin-left: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  padding: 0.5rem 0;
  display: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, visibility 0.15s ease;
}

.popup-submenu-content.show {
  display: block !important;
  opacity: 1;
  visibility: visible;
}

.popup-submenu:hover .popup-submenu-content {
  display: block !important;
  opacity: 1;
  visibility: visible;
}
</style>

