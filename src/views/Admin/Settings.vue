<script setup>
import { ref, onBeforeMount, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import ArgonButton from "@/components/ArgonButton.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { apiGet, apiPost, apiPut } from "@/utils/api.js";

const body = document.getElementsByTagName("body")[0];
const store = useStore();

// Initial loading state
const isLoading = ref(true);

// MT5 Settings
const mt5Form = ref({
  server_ip: "",
  server_login: "",
  server_password: "",
  server_group: "",
});
const mt5Loading = ref(false);
const mt5Message = ref("");
const mt5Type = ref("");
const showMt5Password = ref(false);

// App Settings
const appForm = ref({
  app_name: "",
  crm_url: "",
  front_end_url: "",
  contact_email: "",
  contact_number: "",
  api_base_url: "",
});
const appLoading = ref(false);
const appMessage = ref("");
const appType = ref("");
const lightLogoFile = ref(null);
const darkLogoFile = ref(null);
const lightLogoUrl = ref(null);
const darkLogoUrl = ref(null);
const originalLightLogoUrl = ref(null);
const originalDarkLogoUrl = ref(null);

// Load MT5 Settings
const loadMt5Settings = async () => {
  try {
    const response = await apiGet("/admin/mt5-settings");
    const data = await response.json();
    
    if (data.success && data.data && data.data.setting) {
      mt5Form.value = {
        server_ip: data.data.setting.server_ip || "",
        server_login: data.data.setting.server_login || "",
        server_password: data.data.setting.server_password || "",
        server_group: data.data.setting.server_group || "",
      };
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error loading MT5 settings:", error);
    return false;
  }
};

// Load App Settings
const loadAppSettings = async () => {
  try {
    const response = await apiGet("/admin/app-settings");
    const data = await response.json();
    
    if (data.success && data.data && data.data.setting) {
      appForm.value = {
        app_name: data.data.setting.app_name || "",
        crm_url: data.data.setting.crm_url || "",
        front_end_url: data.data.setting.front_end_url || "",
        contact_email: data.data.setting.contact_email || "",
        contact_number: data.data.setting.contact_number || "",
        api_base_url: data.data.setting.api_base_url || "",
      };
      // Store logo URLs for display
      lightLogoUrl.value = data.data.setting.light_logo_url || null;
      darkLogoUrl.value = data.data.setting.dark_logo_url || null;
      originalLightLogoUrl.value = data.data.setting.light_logo_url || null;
      originalDarkLogoUrl.value = data.data.setting.dark_logo_url || null;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error loading app settings:", error);
    return false;
  }
};

// Load all settings
const loadAllSettings = async () => {
  isLoading.value = true;
  try {
    // Wait for both APIs to complete and populate forms
    await Promise.all([loadMt5Settings(), loadAppSettings()]);
  } catch (error) {
    console.error("Error loading settings:", error);
  } finally {
    // Hide loading spinner only after both APIs complete
    isLoading.value = false;
  }
};

// Update MT5 Settings
const handleUpdateMt5 = async () => {
  mt5Message.value = "";
  mt5Type.value = "";
  
  if (!mt5Form.value.server_ip || !mt5Form.value.server_login || 
      !mt5Form.value.server_password || !mt5Form.value.server_group) {
    mt5Message.value = "All fields are required.";
    mt5Type.value = "error";
    return;
  }
  
  mt5Loading.value = true;
  try {
    const response = await apiPut("/admin/mt5-settings", {
      server_ip: mt5Form.value.server_ip,
      server_login: mt5Form.value.server_login,
      server_password: mt5Form.value.server_password,
      server_group: mt5Form.value.server_group,
    });
    
    const data = await response.json().catch(() => null);
    
    if (response.ok && data?.success) {
      mt5Message.value = data.message || "MT5 settings updated successfully.";
      mt5Type.value = "success";
    } else {
      mt5Message.value = data?.message || "Unable to update MT5 settings.";
      mt5Type.value = "error";
    }
  } catch (error) {
    console.error("MT5 settings update error:", error);
    mt5Message.value = "Unable to update MT5 settings. Please try again.";
    mt5Type.value = "error";
  } finally {
    mt5Loading.value = false;
  }
};

// Handle logo file selection
const handleLightLogoSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type (matching backend: jpeg, jpg, png, svg, webp)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      appMessage.value = "Please select a valid image file (JPEG, JPG, PNG, SVG, or WEBP) for light logo.";
      appType.value = "error";
      event.target.value = '';
      return;
    }
    
    // Validate file size (max 2048KB = 2MB, matching backend)
    const maxSize = 2048 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      appMessage.value = "Light logo file size must be less than 2MB.";
      appType.value = "error";
      event.target.value = '';
      return;
    }
    
    lightLogoFile.value = file;
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      lightLogoUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleDarkLogoSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type (matching backend: jpeg, jpg, png, svg, webp)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      appMessage.value = "Please select a valid image file (JPEG, JPG, PNG, SVG, or WEBP) for dark logo.";
      appType.value = "error";
      event.target.value = '';
      return;
    }
    
    // Validate file size (max 2048KB = 2MB, matching backend)
    const maxSize = 2048 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      appMessage.value = "Dark logo file size must be less than 2MB.";
      appType.value = "error";
      event.target.value = '';
      return;
    }
    
    darkLogoFile.value = file;
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      darkLogoUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Remove logo
const removeLightLogo = () => {
  lightLogoFile.value = null;
  lightLogoUrl.value = originalLightLogoUrl.value;
  const input = document.getElementById('light-logo-input');
  if (input) input.value = '';
};

const removeDarkLogo = () => {
  darkLogoFile.value = null;
  darkLogoUrl.value = originalDarkLogoUrl.value;
  const input = document.getElementById('dark-logo-input');
  if (input) input.value = '';
};

// Update App Settings
const handleUpdateApp = async () => {
  appMessage.value = "";
  appType.value = "";
  
  if (!appForm.value.app_name || !appForm.value.crm_url || 
      !appForm.value.front_end_url || !appForm.value.contact_email || 
      !appForm.value.contact_number || !appForm.value.api_base_url) {
    appMessage.value = "All fields are required.";
    appType.value = "error";
    return;
  }
  
  appLoading.value = true;
  try {
    // Check if we have files to upload
    const hasFiles = lightLogoFile.value || darkLogoFile.value;
    
    let requestData;
    if (hasFiles) {
      // Use FormData (multipart/form-data) when files are present
      requestData = new FormData();
      requestData.append('app_name', appForm.value.app_name);
      requestData.append('crm_url', appForm.value.crm_url);
      requestData.append('front_end_url', appForm.value.front_end_url);
      requestData.append('contact_email', appForm.value.contact_email);
      requestData.append('contact_number', appForm.value.contact_number);
      requestData.append('api_base_url', appForm.value.api_base_url);
      
      // Append logo files if selected
      if (lightLogoFile.value) {
        requestData.append('light_logo', lightLogoFile.value);
      }
      if (darkLogoFile.value) {
        requestData.append('dark_logo', darkLogoFile.value);
      }
    } else {
      // Use JSON (application/json) for text-only updates (more efficient)
      requestData = {
        app_name: appForm.value.app_name,
        crm_url: appForm.value.crm_url,
        front_end_url: appForm.value.front_end_url,
        contact_email: appForm.value.contact_email,
        contact_number: appForm.value.contact_number,
        api_base_url: appForm.value.api_base_url,
      };
    }
    
    const response = await apiPost("/admin/app-settings/update", requestData);
    
    const data = await response.json().catch(() => null);
    
    if (response.ok && data?.success) {
      appMessage.value = data.message || "App settings updated successfully.";
      appType.value = "success";
      
      // Update logo URLs from response data (as per API docs: data.setting structure)
      if (data.data && data.data.setting) {
        if (data.data.setting.light_logo_url) {
          lightLogoUrl.value = data.data.setting.light_logo_url;
          originalLightLogoUrl.value = data.data.setting.light_logo_url;
        }
        if (data.data.setting.dark_logo_url) {
          darkLogoUrl.value = data.data.setting.dark_logo_url;
          originalDarkLogoUrl.value = data.data.setting.dark_logo_url;
        }
      }
      
      // Reset file inputs after successful update
      lightLogoFile.value = null;
      darkLogoFile.value = null;
      const lightInput = document.getElementById('light-logo-input');
      if (lightInput) lightInput.value = '';
      const darkInput = document.getElementById('dark-logo-input');
      if (darkInput) darkInput.value = '';
    } else {
      // Handle validation errors (422)
      if (response.status === 422 && data?.errors) {
        const errorMessages = Object.values(data.errors).flat().join(', ');
        appMessage.value = errorMessages || data?.message || "Validation error occurred.";
      } else {
        appMessage.value = data?.message || "Unable to update app settings.";
      }
      appType.value = "error";
    }
  } catch (error) {
    console.error("App settings update error:", error);
    appMessage.value = "Unable to update app settings. Please try again.";
    appType.value = "error";
  } finally {
    appLoading.value = false;
  }
};

onBeforeMount(async () => {
  store.state.hideConfigButton = true;
  body.classList.add("profile-page");
  await loadAllSettings();
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  body.classList.remove("profile-page");
});
</script>

<template>
  <main class="container-fluid py-4">
    <!-- Loading State -->
    <LoadingSpinner v-if="isLoading" message="Loading settings..." />
    
    <!-- Settings Cards -->
    <div v-else class="row equal-row mb-4">
      <!-- MT5 Settings Card -->
      <div class="col-lg-6 d-flex mb-3 mb-lg-0">
        <div class="card flex-fill">
          <div class="card-header pb-0">
            <h6 class="mb-0">MT5 Settings</h6>
          </div>
          <div class="card-body">
            <!-- result alert -->
            <div
              v-if="mt5Message"
              :class="[
                'alert',
                mt5Type === 'success'
                  ? 'alert-success'
                  : 'alert-danger',
              ]"
            >
              {{ mt5Message }}
            </div>

            <form @submit.prevent="handleUpdateMt5">
              <div class="row">
                <!-- Server IP -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">Server IP</label>
                  <input
                    v-model="mt5Form.server_ip"
                    type="text"
                    class="form-control"
                    placeholder="Server IP"
                  />
                </div>

                <!-- Server Login -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Server Login</label>
                  <input
                    v-model="mt5Form.server_login"
                    type="text"
                    class="form-control"
                    placeholder="Server Login"
                  />
                </div>

                <!-- Server Password -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Server Password</label>
                  <div class="position-relative">
                    <input
                      v-model="mt5Form.server_password"
                      :type="showMt5Password ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Server Password"
                      style="padding-right: 2.5rem;"
                    />
                    <span
                      class="position-absolute top-50 end-0 translate-middle-y me-3"
                      style="cursor: pointer; font-size: 1.1rem; color: #000;"
                      @click="showMt5Password = !showMt5Password"
                    >
                      👁
                    </span>
                  </div>
                </div>

                <!-- Server Group -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">Server Group</label>
                  <input
                    v-model="mt5Form.server_group"
                    type="text"
                    class="form-control"
                    placeholder="Server Group"
                  />
                </div>
              </div>

              <ArgonButton
                class="mt-3"
                color="success"
                variant="gradient"
                :disabled="mt5Loading"
                fullWidth
              >
                {{ mt5Loading ? "Updating..." : "Update MT5 Settings" }}
              </ArgonButton>
            </form>
          </div>
        </div>
      </div>

      <!-- App Settings Card -->
      <div class="col-lg-6 d-flex">
        <div class="card flex-fill">
          <div class="card-header pb-0">
            <h6 class="mb-0">App Settings</h6>
          </div>
          <div class="card-body">
            <!-- result alert -->
            <div
              v-if="appMessage"
              :class="[
                'alert',
                appType === 'success'
                  ? 'alert-success'
                  : 'alert-danger',
              ]"
            >
              {{ appMessage }}
            </div>

            <form @submit.prevent="handleUpdateApp">
              <div class="row">
                <!-- App Name -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">App Name</label>
                  <input
                    v-model="appForm.app_name"
                    type="text"
                    class="form-control"
                    placeholder="App Name"
                  />
                </div>

                <!-- CRM URL -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">CRM URL</label>
                  <input
                    v-model="appForm.crm_url"
                    type="url"
                    class="form-control"
                    placeholder="CRM URL"
                  />
                </div>

                <!-- Front End URL -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Front End URL</label>
                  <input
                    v-model="appForm.front_end_url"
                    type="url"
                    class="form-control"
                    placeholder="Front End URL"
                  />
                </div>

                <!-- Contact Email -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Contact Email</label>
                  <input
                    v-model="appForm.contact_email"
                    type="email"
                    class="form-control"
                    placeholder="Contact Email"
                  />
                </div>

                <!-- Contact Number -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Contact Number</label>
                  <input
                    v-model="appForm.contact_number"
                    type="tel"
                    class="form-control"
                    placeholder="Contact Number"
                  />
                </div>

                <!-- API Base URL -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">API Base URL</label>
                  <input
                    v-model="appForm.api_base_url"
                    type="url"
                    class="form-control"
                    placeholder="API Base URL"
                  />
                </div>

                <!-- Light Logo -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Light Logo</label>
                  <div v-if="lightLogoUrl" class="mb-2">
                    <img 
                      :src="lightLogoUrl" 
                      alt="Light Logo" 
                      class="img-thumbnail"
                      style="max-width: 200px; max-height: 100px; object-fit: contain;"
                    />
                    <button
                      type="button"
                      class="btn btn-sm btn-danger ms-2"
                      @click="removeLightLogo"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    id="light-logo-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                    class="form-control"
                    @change="handleLightLogoSelect"
                  />
                  <small class="text-muted">Upload a logo for light theme (JPEG, JPG, PNG, SVG, or WEBP, max 2MB)</small>
                </div>

                <!-- Dark Logo -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Dark Logo</label>
                  <div v-if="darkLogoUrl" class="mb-2">
                    <img 
                      :src="darkLogoUrl" 
                      alt="Dark Logo" 
                      class="img-thumbnail"
                      style="max-width: 200px; max-height: 100px; object-fit: contain;"
                    />
                    <button
                      type="button"
                      class="btn btn-sm btn-danger ms-2"
                      @click="removeDarkLogo"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    id="dark-logo-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                    class="form-control"
                    @change="handleDarkLogoSelect"
                  />
                  <small class="text-muted">Upload a logo for dark theme (JPEG, JPG, PNG, SVG, or WEBP, max 2MB)</small>
                </div>
              </div>

              <ArgonButton
                class="mt-3"
                color="success"
                variant="gradient"
                :disabled="appLoading"
                fullWidth
              >
                {{ appLoading ? "Updating..." : "Update App Settings" }}
              </ArgonButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* make cards in first row same height */
.equal-row > div {
  display: flex;
}

.equal-row .card {
  flex: 1 1 auto;
}

/* extra vertical space between the two cards on mobile */
@media (max-width: 768px) {
  .container-fluid.py-4 .row > div {
    margin-bottom: 1rem;
  }
}
</style>
