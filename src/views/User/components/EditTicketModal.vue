<script setup>
import { ref, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { apiGet, apiPost, apiPatch } from '@/utils/api.js';

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
const attachments = ref([]);
const loading = ref(false);
const loadingAttachments = ref(false);
const replyMessage = ref('');
const replyFiles = ref([]);
const attachmentFiles = ref([]); // Files for direct upload in attachments tab
const submitting = ref(false);
const uploading = ref(false);
const uploadingAttachment = ref(false);
const errorMessage = ref('');

// Mark ticket as read
const markTicketAsRead = async () => {
  if (!props.ticketId) return;

  try {
    const response = await apiPatch(`/client/tickets/${props.ticketId}/read`);
    const data = await response.json().catch(() => null);

    if (response.ok || data?.success) {
      // Update ticket is_read status if ticket is already loaded
      if (ticket.value) {
        ticket.value.is_read = true;
      }
      // Emit event to update ticket list
      emit('ticket-updated');
    }
  } catch (err) {
    // Silently fail - don't show error to user for read status
    console.error('Error marking ticket as read:', err);
  }
};

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
    } else if (Array.isArray(data?.data)) {
      messages.value = data.data;
    }
  } catch (err) {
    console.error('Error loading conversation:', err);
    errorMessage.value = 'Failed to load conversation history.';
  }
};

// Load attachments
const loadAttachments = async () => {
  if (!props.ticketId) return;

  loadingAttachments.value = true;

  try {
    const response = await apiGet(`/client/tickets/${props.ticketId}/attachments`);
    const data = await response.json().catch(() => null);

    if (data?.success && data?.data) {
      if (Array.isArray(data.data.attachments)) {
        attachments.value = data.data.attachments;
      } else if (Array.isArray(data.data)) {
        attachments.value = data.data;
      }
    } else if (Array.isArray(data?.data?.attachments)) {
      attachments.value = data.data.attachments;
    } else if (Array.isArray(data?.data)) {
      attachments.value = data.data;
    } else if (Array.isArray(data?.attachments)) {
      attachments.value = data.attachments;
    } else {
      attachments.value = [];
    }
  } catch (err) {
    console.error('Error loading attachments:', err);
    errorMessage.value = 'Failed to load attachments.';
    attachments.value = [];
  } finally {
    loadingAttachments.value = false;
  }
};

// Handle file selection
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  replyFiles.value = [...replyFiles.value, ...files];
};

// Remove file from list
const removeFile = (index) => {
  replyFiles.value.splice(index, 1);
};

// Upload attachment separately
const uploadAttachment = async (file) => {
  if (!props.ticketId) return null;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiPost(`/client/tickets/${props.ticketId}/attachments`, formData);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.message || 
        (data?.errors && Object.values(data.errors).flat().join(', ')) ||
        'Failed to upload attachment.';
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error('Error uploading attachment:', err);
    throw err;
  }
};

// Handle attachment file selection (for attachments tab)
const handleAttachmentFileSelect = (event) => {
  const files = Array.from(event.target.files);
  attachmentFiles.value = [...attachmentFiles.value, ...files];
};

// Remove attachment file from list
const removeAttachmentFile = (index) => {
  attachmentFiles.value.splice(index, 1);
};

// Upload attachments from attachments tab
const handleUploadAttachments = async () => {
  if (attachmentFiles.value.length === 0) {
    errorMessage.value = 'Please select at least one file to upload.';
    return;
  }

  uploadingAttachment.value = true;
  errorMessage.value = '';

  try {
    for (const file of attachmentFiles.value) {
      await uploadAttachment(file);
    }

    // Clear files and reload attachments
    attachmentFiles.value = [];
    await loadAttachments();
    emit('ticket-updated');
  } catch (err) {
    console.error('Error uploading attachments:', err);
    errorMessage.value = err.message || 'Failed to upload attachments.';
  } finally {
    uploadingAttachment.value = false;
  }
};

// Handle reply submission
const handleReply = async () => {
  if (!replyMessage.value.trim() && replyFiles.value.length === 0) {
    errorMessage.value = 'Please enter a message or attach a file.';
    return;
  }

  submitting.value = true;
  uploading.value = true;
  errorMessage.value = '';

  try {
    // Upload files first if any
    if (replyFiles.value.length > 0) {
      for (const file of replyFiles.value) {
        await uploadAttachment(file);
      }
    }

    // Send reply message if provided
    if (replyMessage.value.trim()) {
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
    }

    // Clear form
    replyMessage.value = '';
    replyFiles.value = [];
    
    // Reload conversation and attachments
    await loadConversation();
    await loadAttachments();
    emit('ticket-updated');
  } catch (err) {
    console.error('Error sending reply:', err);
    errorMessage.value = err.message || 'Unable to send reply.';
  } finally {
    submitting.value = false;
    uploading.value = false;
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
  } else if (newTab === 'attachments' && props.show) {
    loadAttachments();
  }
});

// Watch for modal show
watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.ticketId) {
      activeTab.value = 'conversation';
      // Mark ticket as read when modal opens
      markTicketAsRead();
      // Load ticket first, then load conversation and attachments
      loadTicket().then(() => {
        loadConversation();
        loadAttachments();
      });
    } else {
      ticket.value = null;
      messages.value = [];
      attachments.value = [];
      replyMessage.value = '';
      replyFiles.value = [];
      attachmentFiles.value = [];
      errorMessage.value = '';
      loading.value = false;
      loadingAttachments.value = false;
    }
  },
  { immediate: true }
);

// Get file icon
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'fa-image';
  if (['pdf'].includes(ext)) return 'fa-file-pdf';
  if (['doc', 'docx'].includes(ext)) return 'fa-file-word';
  if (['xls', 'xlsx'].includes(ext)) return 'fa-file-excel';
  return 'fa-file';
};

// Check if file is an image
const isImageFile = (fileName) => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

// Get attachment URL
const getAttachmentUrl = (attachment) => {
  return attachment.file_url || attachment.url || attachment.path || '';
};

// View image in new tab
const viewImage = (attachment) => {
  const url = getAttachmentUrl(attachment);
  if (url) {
    window.open(url, '_blank');
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

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
    <div class="bg-white rounded-3 shadow-lg" style="width: 90%; max-width: 1000px; max-height: 90vh; overflow-y: auto;">
      <!-- Header -->
      <div class="p-4 border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold d-flex align-items-center gap-2">
            <i class="fas fa-ticket-alt"></i>
            Subject: {{ ticket?.subject || '—' }} - Ticket #{{ props.ticketId || '' }}
            <span
              v-if="ticket"
              class="badge ms-2"
              :style="{
                backgroundColor: ticket.status === 'open' ? '#d4edda' : ticket.status === 'closed' ? '#e2e3e5' : '#fff3cd',
                color: ticket.status === 'open' ? '#28a745' : ticket.status === 'closed' ? '#6c757d' : '#ffc107',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '0.75rem',
              }"
            >
              {{ (ticket.status || 'OPEN').toUpperCase() }}
            </span>
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

      <!-- Content -->
      <div class="p-4">
        <!-- Loading State -->
        <LoadingSpinner v-if="loading" message="Loading..." />

        <!-- Error Message -->
        <div v-else-if="errorMessage" class="alert alert-danger mb-3">
          <i class="fas fa-exclamation-circle me-2"></i>
          {{ errorMessage }}
        </div>

        <!-- Ticket Content -->
        <div v-else-if="ticket">
          <!-- Tabs -->
          <ul class="nav nav-tabs border-0 mb-4">
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
                <i class="fas fa-comments me-1"></i>
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
                <span v-if="attachments.length > 0" class="badge bg-danger ms-1" style="font-size: 0.65rem;">
                  {{ attachments.length }}
                </span>
              </button>
            </li>
          </ul>

          <!-- Conversation History Tab -->
          <div v-if="activeTab === 'conversation'">
            <div class="card border mb-4">
              <div class="card-body">
                <h6 class="fw-bold mb-3">
                  <i class="fas fa-comments me-2"></i>
                  Conversation History
                </h6>
                <div 
                  class="conversation-messages-container"
                  style="max-height: 400px; overflow-y: auto; overflow-x: hidden; padding: 1rem; background-color: #f8f9fa; border-radius: 0.5rem;"
                >
                  <div v-if="messages.length === 0" class="text-center text-muted py-4">
                    No messages yet.
                  </div>
                  <div v-else class="d-flex flex-column gap-3">
                    <div
                      v-for="msg in messages"
                      :key="msg.id"
                      class="d-flex align-items-end gap-2"
                      :class="{ 'justify-content-end': msg.sender_type === 'admin' || msg.sender_type === 'Admin' }"
                    >
                      <!-- User messages on left -->
                      <div
                        v-if="msg.sender_type === 'user' || msg.sender_type === 'User'"
                        class="d-flex align-items-end gap-2"
                      >
                        <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; flex-shrink: 0;">
                          <i class="fas fa-user text-white small"></i>
                        </div>
                        <div
                          class="rounded p-3 text-white"
                          style="background-color: #1e3a8a; max-width: 70%;"
                        >
                          <div class="mb-2">{{ msg.message }}</div>
                          <div class="text-white-50 small" style="font-size: 0.75rem;">
                            <span v-if="msg.user?.name">{{ msg.user.name }}</span>
                            <span v-if="msg.created_at"> | {{ formatDateTime(msg.created_at) }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Admin messages on right -->
                      <div
                        v-else
                        class="d-flex align-items-end gap-2 flex-row-reverse"
                      >
                        <div class="rounded-circle bg-success d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; flex-shrink: 0;">
                          <i class="fas fa-user-shield text-white small"></i>
                        </div>
                        <div
                          class="rounded p-3 text-white"
                          style="background-color: #28a745; max-width: 70%;"
                        >
                          <div class="mb-2">{{ msg.message }}</div>
                          <div class="text-white-50 small" style="font-size: 0.75rem;">
                            <span v-if="msg.admin?.name">{{ msg.admin.name }}</span>
                            <span v-if="msg.created_at"> | {{ formatDateTime(msg.created_at) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reply Section -->
            <div class="card border">
              <div class="card-body">
                <h6 class="fw-bold mb-3">
                  <i class="fas fa-reply me-2"></i>
                  Reply
                </h6>
                <textarea
                  v-model="replyMessage"
                  class="form-control mb-3"
                  rows="4"
                  placeholder="Type your reply..."
                  :disabled="submitting"
                ></textarea>
                
                <!-- File Upload -->
                <div class="mb-2">
                  <label class="form-label text-sm mb-1">Attachments (Optional)</label>
                  <input
                    type="file"
                    class="form-control form-control-sm"
                    multiple
                    @change="handleFileSelect"
                    :disabled="submitting"
                  />
                  <div v-if="replyFiles.length > 0" class="mt-2">
                    <div
                      v-for="(file, index) in replyFiles"
                      :key="index"
                      class="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-1"
                    >
                      <span class="text-sm">
                        <i :class="`fas ${getFileIcon(file.name)} me-2`"></i>
                        {{ file.name }}
                      </span>
                      <button
                        type="button"
                        class="btn btn-sm btn-link text-danger p-0"
                        @click="removeFile(index)"
                        :disabled="submitting"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        <!-- Message Tab -->
        <div v-if="activeTab === 'message'">
          <div class="card border mb-4">
            <div class="card-body">
              <h6 class="fw-bold mb-3">
                <i class="fas fa-envelope me-2"></i>
                Original Message
              </h6>
              <p class="mb-0">{{ ticket.message || 'No message available.' }}</p>
            </div>
          </div>
        </div>

        <!-- Attachments Tab -->
        <div v-if="activeTab === 'attachments'">
          <!-- Upload Section -->
          <div class="card border mb-4">
            <div class="card-body">
              <h6 class="fw-bold mb-3">
                <i class="fas fa-upload me-2"></i>
                Upload Attachments
              </h6>
              <div class="mb-3">
                <label class="form-label">Select Files</label>
                <input
                  type="file"
                  class="form-control"
                  multiple
                  @change="handleAttachmentFileSelect"
                  :disabled="uploadingAttachment"
                />
                <small class="text-muted">You can select multiple files at once.</small>
              </div>
              <div v-if="attachmentFiles.length > 0" class="mb-3">
                <label class="form-label text-sm">Selected Files:</label>
                <div class="d-flex flex-column gap-2">
                  <div
                    v-for="(file, index) in attachmentFiles"
                    :key="index"
                    class="d-flex align-items-center justify-content-between bg-light p-2 rounded"
                  >
                    <span class="text-sm">
                      <i :class="`fas ${getFileIcon(file.name)} me-2`"></i>
                      {{ file.name }}
                    </span>
                    <button
                      type="button"
                      class="btn btn-sm btn-link text-danger p-0"
                      @click="removeAttachmentFile(index)"
                      :disabled="uploadingAttachment"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
              <ArgonButton
                color="success"
                variant="gradient"
                :disabled="attachmentFiles.length === 0 || uploadingAttachment"
                @click="handleUploadAttachments"
              >
                <i class="fas fa-upload me-1"></i>
                {{ uploadingAttachment ? 'Uploading...' : 'Upload Files' }}
              </ArgonButton>
            </div>
          </div>

          <!-- Attachments List -->
          <div>
            <h6 class="fw-bold mb-3">
              <i class="fas fa-paperclip me-2"></i>
              Attachments ({{ attachments.length }})
            </h6>
            <LoadingSpinner v-if="loadingAttachments" message="Loading attachments..." size="md" />
            <div v-else-if="attachments.length === 0" class="text-center text-muted py-4">
              <i class="fas fa-paperclip fa-2x mb-3 opacity-50"></i>
              <p class="mb-0">No attachments available.</p>
            </div>
            <div v-else class="row g-3">
              <div
                v-for="(attachment, index) in attachments"
                :key="attachment.id || index"
                class="col-md-4"
              >
                <div class="card border">
                  <div class="card-body p-3">
                    <!-- Image Preview -->
                    <div v-if="isImageFile(attachment.file_name || attachment.name)" class="mb-3">
                      <img
                        :src="getAttachmentUrl(attachment)"
                        :alt="attachment.file_name || attachment.name || `Attachment ${index + 1}`"
                        class="img-fluid rounded"
                        style="max-height: 200px; width: 100%; object-fit: cover; cursor: pointer;"
                        @click="viewImage(attachment)"
                        @error="(e) => { e.target.style.display = 'none'; }"
                      />
                    </div>
                    
                    <!-- File Icon for non-images -->
                    <div v-else class="text-center mb-3">
                      <i :class="`fas ${getFileIcon(attachment.file_name || attachment.name || 'file')} fa-3x text-primary`"></i>
                    </div>

                    <div class="mb-2">
                      <div class="text-sm fw-bold text-truncate" style="max-width: 100%;">
                        {{ attachment.file_name || attachment.name || `Attachment ${index + 1}` }}
                      </div>
                      <div class="text-xs text-muted">
                        {{ formatFileSize(attachment.size || attachment.file_size) }}
                      </div>
                      <div v-if="attachment.creator" class="text-xs text-muted">
                        By: {{ attachment.creator.name }}
                      </div>
                      <div v-if="attachment.creation_date" class="text-xs text-muted">
                        {{ formatDateTime(attachment.creation_date) }}
                      </div>
                    </div>
                    
                    <div class="d-flex gap-2">
                      <ArgonButton
                        color="info"
                        variant="outline"
                        size="sm"
                        @click="viewImage(attachment)"
                        style="width: 100%;"
                      >
                        <i class="fas fa-eye me-1"></i>
                        View
                      </ArgonButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      <!-- Footer -->
      <div v-if="!loading && ticket" class="p-4 border-top d-flex justify-content-end gap-2">
        <ArgonButton
          color="dark"
          variant="gradient"
          @click="closeModal"
          :disabled="submitting"
        >
          Close
        </ArgonButton>
        <ArgonButton
          v-if="activeTab === 'conversation'"
          color="success"
          variant="gradient"
          :disabled="submitting || !replyMessage.trim()"
          @click="handleReply"
        >
          <i class="fas fa-paper-plane me-1"></i>
          {{ submitting ? 'Sending...' : 'Send Reply' }}
        </ArgonButton>
      </div>
      <div v-else class="p-4 border-top d-flex justify-content-end">
        <ArgonButton
          color="dark"
          variant="gradient"
          @click="closeModal"
        >
          Close
        </ArgonButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-tabs .nav-link.active {
  border-bottom: 2px solid #344767;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.card {
  border-radius: 0.5rem;
}

.conversation-messages-container {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f8f9fa;
}

.conversation-messages-container::-webkit-scrollbar {
  width: 8px;
}

.conversation-messages-container::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 4px;
}

.conversation-messages-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.conversation-messages-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>

