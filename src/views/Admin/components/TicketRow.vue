<script setup>
import { ref, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import { apiPatch } from '@/utils/api.js';

const props = defineProps({
  ticket: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['view', 'status-updated']);

const changingStatus = ref(false);
const currentStatus = ref(props.ticket?.status || 'open');

// Watch for ticket prop changes
watch(() => props.ticket?.status, (newStatus) => {
  if (newStatus) {
    currentStatus.value = newStatus;
  }
}, { immediate: true });

// Handle status change
const handleStatusChange = async (event) => {
  const newStatus = event.target.value;
  if (!props.ticket?.id || newStatus === currentStatus.value) {
    return;
  }

  changingStatus.value = true;
  const previousStatus = currentStatus.value;

  try {
    const response = await apiPatch(`/admin/tickets/${props.ticket.id}/status`, {
      status: newStatus,
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      currentStatus.value = newStatus;
      emit('status-updated', props.ticket.id, newStatus);
    } else {
      // Revert dropdown to original status
      currentStatus.value = previousStatus;
      alert(data?.message || 'Failed to update ticket status.');
    }
  } catch (err) {
    console.error('Error updating ticket status:', err);
    // Revert dropdown to original status
    currentStatus.value = previousStatus;
    event.target.value = previousStatus;
    alert('Failed to update ticket status.');
  } finally {
    changingStatus.value = false;
  }
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
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (e) {
    return '—';
  }
};

const getStatusColor = (status) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'open') return '#28a745'; // green
  if (statusLower === 'closed') return '#6c757d'; // gray
  if (statusLower === 'pending') return '#ffc107'; // yellow
  return '#6c757d';
};

const getStatusBgColor = (status) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'open') return '#d4edda';
  if (statusLower === 'closed') return '#e2e3e5';
  if (statusLower === 'pending') return '#fff3cd';
  return '#e2e3e5';
};
</script>

<template>
  <tr>
    <td class="text-sm text-dark fw-bold" style="padding: 0.75rem;">
      {{ ticket.ticket_no || ticket.id || '—' }}
    </td>
    <td class="text-sm text-dark" style="padding: 0.75rem;">
      {{ ticket.user?.name || ticket.user_name || '—' }}
    </td>
    <td class="text-sm text-dark" style="padding: 0.75rem;">
      {{ ticket.subject || '—' }}
    </td>
    <td style="padding: 0.75rem;">
      <div class="d-flex align-items-center gap-2">
        <select
          v-model="currentStatus"
          @change="handleStatusChange"
          :disabled="changingStatus"
          class="form-select form-select-sm"
          :style="{
            width: 'auto',
            minWidth: '100px',
            backgroundColor: getStatusBgColor(currentStatus),
            color: getStatusColor(currentStatus),
            border: `1px solid ${getStatusColor(currentStatus)}`,
            fontWeight: '600',
            fontSize: '0.7rem',
            padding: '4px 8px',
            borderRadius: '20px',
            cursor: changingStatus ? 'not-allowed' : 'pointer',
          }"
        >
          <option value="open" :style="{ backgroundColor: '#d4edda', color: '#28a745' }">OPEN</option>
          <option value="closed" :style="{ backgroundColor: '#e2e3e5', color: '#6c757d' }">CLOSED</option>
        </select>
        <span
          v-if="ticket.is_read === false || ticket.unread_count > 0"
          class="badge badge-sm bg-danger"
          style="padding: 2px 6px; border-radius: 50%; font-size: 0.6rem;"
          title="Unread messages"
        >
          {{ ticket.unread_count || '!' }}
        </span>
      </div>
    </td>
    <td class="text-sm text-dark" style="padding: 0.75rem;">
      {{ formatDate(ticket.created_at || ticket.created_date) }}
    </td>
    <td style="padding: 0.75rem;">
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
.badge-sm {
  font-size: 0.7rem;
  font-weight: 600;
}
</style>



