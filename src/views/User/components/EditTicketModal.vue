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
const attachments = ref([]);
const loading = ref(false);
const replyMessage = ref('');
const replyFiles = ref([]);
const attachmentFiles = ref([]); // Files for direct upload in attachments tab
const submitting = ref(false);
const uploading = ref(false);
const uploadingAttachment = ref(false);
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

// Load attachments
const loadAttachments = async () => {
  if (!props.ticketId) return;

  loading.value = true;

  try {
    const response = await apiGet(`/client/tickets/${props.ticketId}/attachments`);
    const data = await response.json().catch(() => null);

    if (data?.success && data?.data) {
      if (Array.isArray(data.data.attachments)) {
        attachments.value = data.data.attachments;
      } else if (Array.isArray(data.data)) {
        attachments.value = data.data;
      }
    } else if (Array.isArray(data?.data)) {
      attachments.value = data.data;
    } else if (Array.isArray(data?.attachments)) {
      attachments.value = data.attachments;
    }
  } catch (err) {
    console.error('Error loading attachments:', err);
    errorMessage.value = 'Failed to load attachments.';
  } finally {
    loading.value = false;
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
      loadTicket();
      loadConversation();
      loadAttachments();
    } else {
      ticket.value = null;
      messages.value = [];
      attachments.value = [];
      replyMessage.value = '';
      replyFiles.value = [];
      attachmentFiles.value = [];
      errorMessage.value = '';
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

// Download attachment
const downloadAttachment = (attachment) => {
  const url = attachment.file_url || attachment.url || attachment.path;
  if (url) {
    window.open(url, '_blank');
  }
};

const closeModal = () => {
  emit('update:show', false);
};
</script>

<template>
  <div
    v-if="props.show"
    class="modal-overlay"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-3 shadow-lg modal-container d-flex flex-column">
      <!-- Header - Fixed -->
      <div class="px-3 py-2 border-bottom flex-shrink-0">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2" style="font-size: 0.9rem;">
            <span v-if="ticket" class="text-muted">
              <span class="fw-bold">Subject:</span> {{ ticket.subject }}
            </span>
            <span class="text-muted">-</span>
            <span class="fw-bold">Edit Ticket {{ props.ticketId || '' }}</span>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-link text-dark p-0"
            @click="closeModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Tabs - Fixed -->
      <div class="px-4 flex-shrink-0">
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

      <!-- Content - Scrollable -->
      <div class="px-4 pb-4 flex-grow-1 overflow-auto modal-content-area">
        <div v-if="loading && !ticket" class="text-center text-muted py-5">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Loading...
        </div>

        <div v-else-if="errorMessage" class="alert alert-danger mb-3">
          {{ errorMessage }}
        </div>

        <!-- Conversation History Tab -->
        <div v-if="activeTab === 'conversation' && ticket" class="d-flex flex-column conversation-wrapper">
          <!-- Messages - Scrollable Area -->
          <div class="conversation-messages flex-grow-1 overflow-auto mb-3">
            <div v-if="messages.length === 0" class="text-center text-muted py-4">
              No messages yet.
            </div>
            <div v-else class="d-flex flex-column gap-3 p-2">
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

          <!-- Reply Section - Fixed at Bottom -->
          <div class="border-top pt-3 reply-section flex-shrink-0 bg-white">
            <label class="form-label fw-bold mb-2">Reply</label>
            <textarea
              v-model="replyMessage"
              class="form-control mb-2"
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

        <!-- Message Tab -->
        <div v-if="activeTab === 'message' && ticket">
          <div class="p-3 border rounded">
            <p class="mb-0">{{ ticket.message || 'No message available.' }}</p>
          </div>
        </div>

        <!-- Attachments Tab -->
        <div v-if="activeTab === 'attachments'">
          <!-- Error Message -->
          <div v-if="errorMessage" class="alert alert-danger mb-3">
            {{ errorMessage }}
          </div>

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
            <div v-if="loading" class="text-center text-muted py-4">
              <i class="fas fa-spinner fa-spin me-2"></i>
              Loading attachments...
            </div>
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
                    <div class="d-flex align-items-center mb-2">
                      <i :class="`fas ${getFileIcon(attachment.file_name || attachment.name || 'file')} fa-2x text-primary me-2`"></i>
                      <div class="flex-grow-1">
                        <div class="text-sm fw-bold text-truncate" style="max-width: 150px;">
                          {{ attachment.file_name || attachment.name || `Attachment ${index + 1}` }}
                        </div>
                        <div class="text-xs text-muted">
                          {{ attachment.size ? `${(attachment.size / 1024).toFixed(2)} KB` : '' }}
                        </div>
                        <div v-if="attachment.creator" class="text-xs text-muted">
                          By: {{ attachment.creator.name }}
                        </div>
                      </div>
                    </div>
                    <ArgonButton
                      color="success"
                      variant="gradient"
                      size="sm"
                      fullWidth
                      @click="downloadAttachment(attachment)"
                    >
                      <i class="fas fa-download me-1"></i>
                      Download
                    </ArgonButton>
                  </div>
                </div>
              </div>
            </div>
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
          :disabled="submitting || (!replyMessage.trim() && replyFiles.length === 0)"
          @click="handleReply"
        >
          {{ submitting ? (uploading ? 'Uploading...' : 'Sending...') : 'Send Reply' }}
        </ArgonButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 10px;
}

.modal-container {
  width: 90%;
  max-width: 900px;
  height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0;
}

.modal-content-area {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
}

.conversation-wrapper {
  min-height: 0;
  height: 450px;
  display: flex;
  flex-direction: column;
}

.conversation-messages {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
}

.reply-section {
  background-color: white;
  padding-top: 1rem;
  flex-shrink: 0;
}

@media (max-width: 992px) {
  .modal-container {
    width: 95%;
    height: calc(100vh - 20px);
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 100%;
    height: calc(100vh - 20px);
    border-radius: 0;
  }
  
  .conversation-wrapper {
    height: 350px;
  }
}
</style>

