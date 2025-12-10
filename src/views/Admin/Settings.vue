<script setup>
import { ref, onBeforeMount, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import ArgonButton from "@/components/ArgonButton.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { apiGet, apiPut } from "@/utils/api.js";

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
    const response = await apiPut("/admin/app-settings", {
      app_name: appForm.value.app_name,
      crm_url: appForm.value.crm_url,
      front_end_url: appForm.value.front_end_url,
      contact_email: appForm.value.contact_email,
      contact_number: appForm.value.contact_number,
      api_base_url: appForm.value.api_base_url,
    });
    
    const data = await response.json().catch(() => null);
    
    if (response.ok && data?.success) {
      appMessage.value = data.message || "App settings updated successfully.";
      appType.value = "success";
    } else {
      appMessage.value = data?.message || "Unable to update app settings.";
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
