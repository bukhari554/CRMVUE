<script setup>
import { ref, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import { apiGet, apiPost } from '@/utils/api.js';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  ticketId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(['update:show', 'ticket-updated']);

const activeTab = ref('conversation');
const ticket = ref(null);
const messages = ref([]);
const loading = ref(false);
const replyMessage = ref('');
const submitting = ref(false);
const errorMessage = ref('');

// Load ticket details
const loadTicket = async () => {
  if (!props.ticketId) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await apiGet(`/client/tickets/${props.ticketId}`);
    const data = await response.json().catch(() => null);

    if (data?.success && data?.data?.ticket) {
      ticket.value = data.data.ticket;
    } else if (data?.data?.ticket) {
      ticket.value = data.data.ticket;
    }
  } catch (err) {
    console.error('Error loading ticket:', err);
    errorMessage.value = 'Failed to load ticket details.';
  } finally {
    loading.value = false;
  }
};

// Load conversation history
const loadConversation = async () => {
  if (!props.ticketId) return;

  loading.value = true;

  try {
    const response = await apiGet(`/client/tickets/${props.ticketId}/conversation`);
    const data = await response.json().catch(() => null);

    if (data?.success && data?.data) {
      if (data.data.messages) {
        messages.value = data.data.messages;
      }
      if (data.data.ticket && !ticket.value) {
        ticket.value = data.data.ticket;
      }
    } else if (data?.data?.messages) {
      messages.value = data.data.messages;
    }
  } catch (err) {
    console.error('Error loading conversation:', err);
    errorMessage.value = 'Failed to load conversation history.';
  } finally {
    loading.value = false;
  }
};

// Handle reply submission
const handleReply = async () => {
  if (!replyMessage.value.trim()) {
    errorMessage.value = 'Please enter a message.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';

  try {
    const response = await apiPost(`/client/tickets/${props.ticketId}/reply`, {
      message: replyMessage.value,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg =
        data?.message ||
        (data?.errors && Object.values(data.errors).flat().join(', ')) ||
        'Failed to send reply.';
      throw new Error(msg);
    }

    replyMessage.value = '';
    await loadConversation();
    emit('ticket-updated');
  } catch (err) {
    console.error('Error sending reply:', err);
    errorMessage.value = err.message || 'Unable to send reply.';
  } finally {
    submitting.value = false;
  }
};

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return '';
  }
};

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'conversation' && props.show) {
    loadConversation();
  }
});

// Watch for modal show
watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.ticketId) {
      activeTab.value = 'conversation';
      loadTicket();
      loadConversation();
    } else {
      ticket.value = null;
      messages.value = [];
      replyMessage.value = '';
      errorMessage.value = '';
    }
  },
  { immediate: true }
);

const closeModal = () => {
  emit('update:show', false);
};
</script>

<template>
  <div
    v-if="props.show"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1050;"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-3 shadow-lg" style="width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
      <!-- Header -->
      <div class="p-4 border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold d-flex align-items-center gap-2">
            <i class="fas fa-edit"></i>
            Edit Ticket {{ props.ticketId || '' }}
          </h5>
          <button
            type="button"
            class="btn btn-sm btn-link text-dark p-0"
            @click="closeModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Subject -->
      <div v-if="ticket" class="px-4 pt-3">
        <div
          class="p-3 rounded mb-3"
          style="background-color: #e3f2fd;"
        >
          <span class="fw-bold">Subject :</span> {{ ticket.subject }}
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-4">
        <ul class="nav nav-tabs border-0 mb-3">
          <li class="nav-item">
            <button
              class="nav-link border-0"
              :class="{
                'text-dark fw-bold active': activeTab === 'message',
                'text-muted': activeTab !== 'message',
              }"
              @click="activeTab = 'message'"
            >
              <i class="fas fa-comment me-1"></i>
              Message
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link border-0 position-relative"
              :class="{
                'text-dark fw-bold active': activeTab === 'conversation',
                'text-muted': activeTab !== 'conversation',
              }"
              @click="activeTab = 'conversation'"
            >
              <i class="fas fa-redo me-1"></i>
              Conversation History
              <div
                v-if="activeTab === 'conversation'"
                class="position-absolute start-0"
                style="bottom: 0; width: 100%; height: 2px; background-color: #344767;"
              ></div>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link border-0"
              :class="{
                'text-dark fw-bold active': activeTab === 'attachments',
                'text-muted': activeTab !== 'attachments',
              }"
              @click="activeTab = 'attachments'"
            >
              <i class="fas fa-paperclip me-1"></i>
              Attachments
            </button>
          </li>
        </ul>
      </div>

      <!-- Content -->
      <div class="px-4 pb-4">
        <div v-if="loading && !ticket" class="text-center text-muted py-5">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Loading...
        </div>

        <div v-else-if="errorMessage" class="alert alert-danger mb-3">
          {{ errorMessage }}
        </div>

        <!-- Conversation History Tab -->
        <div v-if="activeTab === 'conversation' && ticket">
          <div class="mb-4">
            <!-- Messages -->
            <div v-if="messages.length === 0" class="text-center text-muted py-4">
              No messages yet.
            </div>
            <div v-else class="d-flex flex-column gap-3">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="d-flex align-items-end gap-2"
                :class="{ 'justify-content-end': msg.sender_type === 'user' }"
              >
                <div
                  class="rounded p-3 text-white"
                  :style="{
                    backgroundColor: msg.sender_type === 'user' ? '#1e3a8a' : '#6c757d',
                    maxWidth: '70%',
                  }"
                >
                  <div class="mb-2">{{ msg.message }}</div>
                  <div class="text-white-50 small" style="font-size: 0.75rem;">
                    <span v-if="msg.user?.id">{{ msg.user.id }}</span>
                    <span v-if="msg.user?.name"> | {{ msg.user.name }}</span>
                    <span v-if="msg.created_at"> | {{ formatDateTime(msg.created_at) }}</span>
                  </div>
                </div>
                <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                  <i class="fas fa-user text-white small"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Reply Section -->
          <div class="border-top pt-3">
            <label class="form-label fw-bold mb-2">Reply</label>
            <textarea
              v-model="replyMessage"
              class="form-control"
              rows="4"
              placeholder="Type your reply..."
            ></textarea>
          </div>
        </div>

        <!-- Message Tab -->
        <div v-if="activeTab === 'message' && ticket">
          <div class="p-3 border rounded">
            <p class="mb-0">{{ ticket.message || 'No message available.' }}</p>
          </div>
        </div>

        <!-- Attachments Tab -->
        <div v-if="activeTab === 'attachments'">
          <div class="text-center text-muted py-4">
            No attachments available.
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-top d-flex justify-content-end">
        <ArgonButton
          color="dark"
          variant="gradient"
          @click="closeModal"
        >
          Close
        </ArgonButton>
        <ArgonButton
          v-if="activeTab === 'conversation'"
          color="warning"
          variant="gradient"
          class="ms-2"
          :disabled="submitting || !replyMessage.trim()"
          @click="handleReply"
        >
          {{ submitting ? 'Sending...' : 'Send Reply' }}
        </ArgonButton>
      </div>
    </div>
  </div>
</template>

