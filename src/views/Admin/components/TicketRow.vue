<script setup>
import { ref, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import TicketStatusToggle from '@/views/Admin/components/Tickets/TicketStatusToggle.vue';
import { showToast } from '@/utils/toast';


const props = defineProps({
  ticket: {
    type: Object,
    required: true,
  }
});

const emit = defineEmits(['view', 'status-updated']);

const currentStatus = ref(props.ticket?.status || 'open');
const errorMessage = ref('');

// Watch for ticket prop changes
watch(() => props.ticket?.status, (newStatus) => {
  if (newStatus) {
    currentStatus.value = newStatus;
  }
}, { immediate: true });

const handleStatusUpdated = (event) => {
  currentStatus.value = event.newStatus;
  errorMessage.value = '';
  emit('status-updated', event.ticketId, event.newStatus);
  
  // Show success toast
  showToast('Status updated successfully!', 'success');
};

const handleStatusError = (event) => {
  errorMessage.value = event.error;
  showToast(event.error, 'error');
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return '—';
  }
};
</script>

<template>
  <tr class="ticket-row">
    <td class="text-sm text-dark fw-bold ticket-cell">
      {{ ticket.ticket_no || ticket.id || '—' }}
    </td>
    <td class="text-sm text-dark ticket-cell">
      {{ ticket.user?.name || ticket.user_name || '—' }}
    </td>
    <td class="text-sm text-dark ticket-cell">
      {{ ticket.subject || '—' }}
    </td>
    <td class="ticket-cell">
      <div class="d-flex align-items-center gap-2">
        <!-- TicketStatusToggle Component -->
        <TicketStatusToggle
          :ticket-id="ticket.id"
          :current-status="currentStatus"
          @status-updated="handleStatusUpdated"
          @status-error="handleStatusError"
        />

        <!-- Read/Unread Envelope Icon -->
        <div class="position-relative" style="display: inline-block;">
          <i
            :class="ticket.is_read ? 'fas fa-envelope-open' : 'fas fa-envelope'"
            :style="{
              fontSize: '14px',
              color: ticket.is_read ? '#6c757d' : '#dc3545'
            }"
            :title="ticket.is_read ? 'Read' : 'Unread'"
          ></i>
          <span
            v-if="!ticket.is_read"
            class="position-absolute badge rounded-pill bg-danger"
            style="top: -2px; right: -2px; width: 6px; height: 6px; padding: 0; font-size: 0; border: 1px solid white;"
          ></span>
        </div>

        <!-- Unread Badge -->
        <span
          v-if="ticket.is_read === false || ticket.unread_count > 0"
          class="badge badge-sm bg-danger"
          style="padding: 2px 6px; border-radius: 50%; font-size: 0.6rem;"
          title="Unread messages"
        >
          {{ ticket.unread_count || '!' }}
        </span>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-danger text-xs mt-1">
        <i class="fas fa-exclamation-circle me-1"></i>
        {{ errorMessage }}
      </div>
    </td>
    <td class="text-sm text-dark ticket-cell">
      {{ formatDate(ticket.created_at || ticket.created_date) }}
    </td>
    <td class="ticket-cell">
      <ArgonButton
        color="success"
        variant="gradient"
        size="sm"
        @click="$emit('view', ticket)"
      >
        <i class="fas fa-eye me-1"></i>
        View
      </ArgonButton>
    </td>
  </tr>
</template>

<style scoped>
.ticket-row {
  transition: all 0.3s ease;
  border-bottom: 1px solid #e9ecef;
}

.ticket-row:hover {
  background-color: #f8f9fa;
}

.ticket-cell {
  padding: 0.75rem;
  /* Remove any overflow hidden */
  overflow: visible !important;
}

.badge-sm {
  font-size: 0.7rem;
  font-weight: 600;
}

.text-xs {
  font-size: 0.7rem;
}

/* Custom Toast Notification */
:global(.custom-toast) {
  position: fixed;
  top: 24px;
  right: 24px;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-size: 0.9375rem;
  font-weight: 600;
  z-index: 9999;
  opacity: 0;
  transform: translateX(400px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 280px;
  max-width: 420px;
}

:global(.custom-toast.show) {
  opacity: 1;
  transform: translateX(0);
}

:global(.custom-toast.success) {
  border-left: 4px solid #28a745;
  color: #155724;
  background: linear-gradient(135deg, #f0fff4 0%, #e6ffe6 100%);
}

:global(.custom-toast.success i) {
  color: #28a745;
  font-size: 1.5rem;
}

:global(.custom-toast.error) {
  border-left: 4px solid #dc3545;
  color: #721c24;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
}

:global(.custom-toast.error i) {
  color: #dc3545;
  font-size: 1.5rem;
}

:global(.custom-toast.info) {
  border-left: 4px solid #17a2b8;
  color: #0c5460;
  background: linear-gradient(135deg, #f0fbff 0%, #e0f7ff 100%);
}

:global(.custom-toast.info i) {
  color: #17a2b8;
  font-size: 1.5rem;
}
</style>