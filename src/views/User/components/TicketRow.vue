<script setup>
import { ref } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import { apiPatch } from '@/utils/api.js';

const props = defineProps({
  ticket: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['toggle-favorite', 'edit']);

// Track if favorite toggle is in progress to prevent multiple clicks
const isTogglingFavorite = ref(false);

const toggleFavorite = async () => {
  // Prevent multiple simultaneous requests
  if (isTogglingFavorite.value) {
    return;
  }

  isTogglingFavorite.value = true;
  
  try {
    const newFavoriteStatus = !props.ticket.is_favorite;
    const response = await apiPatch(`/client/tickets/${props.ticket.id}/favorite`, {
      is_favorite: newFavoriteStatus
    });
    
    // Check if the request was successful
    if (response.ok) {
      emit('toggle-favorite', props.ticket.id);
    } else {
      console.error('Failed to toggle favorite:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  } finally {
    // Re-enable after a short delay to prevent rapid clicking
    setTimeout(() => {
      isTogglingFavorite.value = false;
    }, 500);
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
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '—';
  }
};

const truncateMessage = (message, maxLength = 50) => {
  if (!message || typeof message !== 'string') return '—';
  const trimmed = message.trim();
  if (!trimmed) return '—';
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) + '...' : trimmed;
};

// Get last message from ticket
const getLastMessage = (ticket) => {
  // Check if ticket has last_message field (common API pattern)
  if (ticket.last_message) {
    return truncateMessage(ticket.last_message, 50);
  }
  
  // Check if ticket has messages array
  if (ticket.messages && Array.isArray(ticket.messages) && ticket.messages.length > 0) {
    // Sort messages by created_at to get the most recent one
    const sortedMessages = [...ticket.messages].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });
    const lastMsg = sortedMessages[0];
    // Handle different message field names
    const messageText = lastMsg.message || lastMsg.content || lastMsg.text || lastMsg.body;
    if (messageText) {
      return truncateMessage(messageText, 50);
    }
  }
  
  // Check for conversation array
  if (ticket.conversation && Array.isArray(ticket.conversation) && ticket.conversation.length > 0) {
    const sortedConversation = [...ticket.conversation].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });
    const lastConv = sortedConversation[0];
    const messageText = lastConv.message || lastConv.content || lastConv.text || lastConv.body;
    if (messageText) {
      return truncateMessage(messageText, 50);
    }
  }
  
  // Fallback to ticket message, description, or subject
  return truncateMessage(
    ticket.message || 
    ticket.description || 
    ticket.last_reply || 
    ticket.recent_message ||
    '', 
    50
  );
};
</script>

<template>
  <tr>
    <td class="text-sm text-dark fw-bold" style="padding: 0.75rem;">{{ ticket.ticket_no || ticket.id || '—' }}</td>
    <td style="padding: 0.75rem;">
      <div class="d-flex align-items-center gap-2">
        <span
          class="badge badge-sm"
          style="background-color: #fb6340; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 0.7rem;"
        >
          {{ ticket.status?.toUpperCase() || 'OPEN' }}
        </span>
        <i
          :class="ticket.is_favorite ? 'fas fa-star' : 'far fa-star'"
          :style="{
            cursor: isTogglingFavorite ? 'not-allowed' : 'pointer',
            color: ticket.is_favorite ? '#1e3a8a' : '#6c757d',
            fontSize: '14px',
            opacity: isTogglingFavorite ? 0.6 : 1,
            pointerEvents: isTogglingFavorite ? 'none' : 'auto'
          }"
          @click="toggleFavorite"
          :title="isTogglingFavorite ? 'Updating...' : (ticket.is_favorite ? 'Remove from favorites' : 'Add to favorites')"
        ></i>
      </div>
    </td>
    <td class="text-sm text-dark" style="padding: 0.75rem;">{{ ticket.category?.name || ticket.category || '—' }}</td>
    <td class="text-sm text-dark" style="padding: 0.75rem;">{{ formatDate(ticket.start_date || ticket.created_at) }}</td>
    <td class="text-sm text-dark" style="padding: 0.75rem;">{{ ticket.subject || '—' }}</td>
    <td class="text-sm text-muted" style="padding: 0.75rem;">{{ getLastMessage(ticket) }}</td>
    <td style="padding: 0.75rem;">
      <ArgonButton
        color="success"
        variant="gradient"
        size="sm"
        @click="$emit('edit', ticket)"
      >
        <i class="fas fa-comment me-1"></i>
        Edit
      </ArgonButton>
    </td>
  </tr>
</template>

