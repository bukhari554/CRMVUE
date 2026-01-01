<script setup>
import { ref, computed, watch } from 'vue';
import { apiPatch } from '@/utils/api.js';

const props = defineProps({
  ticketId: {
    type: [Number, String],
    required: true
  },
  currentStatus: {
    type: String,
    required: true
  },
  apiEndpoint: {
    type: String,
    default: '/admin/tickets/{id}/status'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['status-updated', 'status-error']);

const loading = ref(false);
const selectedStatus = ref(props.currentStatus);
const showDropdown = ref(false);
const toggleRef = ref(null);
const dropdownStyle = ref({});

watch(() => props.currentStatus, (newStatus) => {
  selectedStatus.value = newStatus;
}, { immediate: true });

const isOpen = computed(() => {
  return (selectedStatus.value || '').toLowerCase() === 'open';
});

const statusDisplay = computed(() => {
  if (isOpen.value) {
    return {
      label: 'OPEN',
      color: '#28a745',
      bgColor: '#d4edda',
      icon: 'fa-check-circle',
      toggleLabel: 'Close Ticket'
    };
  } else {
    return {
      label: 'CLOSED',
      color: '#6c757d',
      bgColor: '#e2e3e5',
      icon: 'fa-times-circle',
      toggleLabel: 'Reopen Ticket'
    };
  }
});

const badgeStyle = computed(() => ({
  backgroundColor: statusDisplay.value.bgColor,
  color: statusDisplay.value.color,
  border: `2px solid ${statusDisplay.value.color}`,
  fontWeight: '700',
  fontSize: '0.75rem',
  padding: '6px 16px',
  borderRadius: '25px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: loading.value || props.disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.3s ease',
  minWidth: '120px',
  justifyContent: 'center',
  userSelect: 'none',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}));

const updateDropdownPosition = () => {
  if (!toggleRef.value) return;
  
  const rect = toggleRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 5}px`,
    left: `${rect.left}px`,
    zIndex: 9999
  };
};

const toggleStatus = async () => {
  if (loading.value || props.disabled) return;

  const newStatus = isOpen.value ? 'closed' : 'open';
  
  loading.value = true;
  const previousStatus = selectedStatus.value;

  try {
    const endpoint = props.apiEndpoint.replace('{id}', props.ticketId);
    
    console.group('🔄 Toggle Ticket Status');
    console.log('Ticket ID:', props.ticketId);
    console.log('Action:', isOpen.value ? 'Close' : 'Reopen');
    console.log('Old Status:', previousStatus);
    console.log('New Status:', newStatus);
    console.groupEnd();

    const response = await apiPatch(endpoint, { status: newStatus });
    const data = await response.json().catch(() => null);

    if (response.ok || data?.success) {
      selectedStatus.value = newStatus;
      emit('status-updated', {
        ticketId: props.ticketId,
        oldStatus: previousStatus,
        newStatus: newStatus,
        data: data
      });
      console.log('✅ Status toggled successfully');
    } else {
      selectedStatus.value = previousStatus;
      const errorMsg = data?.message || `Failed to update status: ${response.status}`;
      emit('status-error', { ticketId: props.ticketId, error: errorMsg });
      console.error('❌ Toggle failed:', errorMsg);
    }
  } catch (error) {
    console.error('💥 Error toggling status:', error);
    selectedStatus.value = previousStatus;
    emit('status-error', { ticketId: props.ticketId, error: error.message });
  } finally {
    loading.value = false;
    showDropdown.value = false;
  }
};

const handleMouseEnter = () => {
  if (!loading.value && !props.disabled) {
    updateDropdownPosition();
    showDropdown.value = true;
  }
};

const handleMouseLeave = () => {
  showDropdown.value = false;
};
</script>

<template>
  <div 
    ref="toggleRef"
    class="ticket-status-toggle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Status Badge -->
    <div 
      class="status-badge"
      :style="badgeStyle"
      @click="toggleStatus"
    >
      <i 
        v-if="loading" 
        class="fas fa-spinner fa-spin"
      ></i>
      <i 
        v-else
        class="fas" 
        :class="statusDisplay.icon"
      ></i>
      <span class="status-text">
        {{ statusDisplay.label }}
      </span>
      
      <!-- Hover Dropdown Arrow -->
      <i 
        v-if="!loading"
        class="fas fa-chevron-down dropdown-arrow"
        :class="{ 'rotate': showDropdown }"
      ></i>
    </div>

    <!-- Fixed Position Dropdown -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div 
          v-if="showDropdown && !loading"
          class="status-dropdown"
          :style="dropdownStyle"
          @click="toggleStatus"
          @mouseenter="showDropdown = true"
          @mouseleave="showDropdown = false"
        >
          <div class="dropdown-item">
            <i 
              class="fas" 
              :class="isOpen ? 'fa-times-circle' : 'fa-redo-alt'"
              :style="{ color: isOpen ? '#dc3545' : '#28a745' }"
            ></i>
            <span>{{ statusDisplay.toggleLabel }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ticket-status-toggle {
  display: inline-block;
}

.status-badge {
  white-space: nowrap;
}

.status-badge:hover:not([style*="cursor: not-allowed"]) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.status-badge:active:not([style*="cursor: not-allowed"]) {
  transform: translateY(0);
}

.status-text {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.dropdown-arrow {
  font-size: 0.65rem;
  transition: transform 0.3s ease;
  margin-left: 0.25rem;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg);
}

.status-dropdown {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 150px;
}

.dropdown-item {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
  font-weight: 600;
  color: #344767;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item i {
  font-size: 1rem;
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>