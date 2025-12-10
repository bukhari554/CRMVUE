<script setup>
import { computed, ref, onBeforeMount, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import ArgonButton from "@/components/ArgonButton.vue";
import { apiPost } from "@/utils/api.js";

const body = document.getElementsByTagName("body")[0];
const store = useStore();

const currentUser = computed(() => store.getters.currentUser || {});

const passwordForm = ref({
  current_password: "",
  new_password: "",
  new_password_confirmation: "",
});
const passwordMessage = ref("");
const passwordType = ref("");
const passwordLoading = ref(false);

// eye toggles
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const handleChangePassword = async () => {
  passwordMessage.value = "";
  passwordType.value = "";

  if (
    !passwordForm.value.current_password ||
    !passwordForm.value.new_password ||
    !passwordForm.value.new_password_confirmation
  ) {
    passwordMessage.value = "All password fields are required.";
    passwordType.value = "error";
    return;
  }

  if (
    passwordForm.value.new_password !==
    passwordForm.value.new_password_confirmation
  ) {
    passwordMessage.value = "New password and confirmation must match.";
    passwordType.value = "error";
    return;
  }

  passwordLoading.value = true;
  try {
    const response = await apiPost("/admin/change-password", {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
      new_password_confirmation:
        passwordForm.value.new_password_confirmation,
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      passwordMessage.value = data.message || "Password updated successfully.";
      passwordType.value = "success";
      passwordForm.value = {
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      };
    } else {
      passwordMessage.value =
        data?.message ||
        (response.status === 422
          ? "Validation failed. Please check your input."
          : "Unable to change password.");
      passwordType.value = "error";
    }
  } catch (error) {
    console.error("Password change error:", error);
    passwordMessage.value =
      "Unable to change password. Please try again.";
    passwordType.value = "error";
  } finally {
    passwordLoading.value = false;
  }
};

onBeforeMount(() => {
  store.state.hideConfigButton = true;
  body.classList.add("profile-page");
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  body.classList.remove("profile-page");
});
</script>

<template>
  <main class="container-fluid py-4">
    <!-- FIRST ROW -->
    <div class="row equal-row mb-4">
      <!-- PROFILE CARD -->
      <div class="col-lg-4 d-flex mb-3 mb-lg-0">
        <div class="card flex-fill">
          <div class="card-body text-center">
            <!-- user icon -->
            <div
              class="avatar avatar-lg bg-gradient-primary rounded-circle d-flex align-items-center justify-content-center mb-3 mx-auto"
            >
              <i class="ni ni-single-02 text-white"></i>
            </div>

            <!-- name -->
            <h5 class="mb-1">
              {{ currentUser.name || 
                 (currentUser.first_name && currentUser.last_name 
                   ? `${currentUser.first_name} ${currentUser.last_name}` 
                   : currentUser.first_name || currentUser.last_name || "—") }}
            </h5>

            <!-- role -->
            <div class="text-muted mb-3">
              Role: {{ currentUser.role || "Admin" }}
            </div>

            <hr class="my-3" />

            <!-- email -->
            <div class="mb-2 text-start">
              <strong>Email</strong>
              <div>{{ currentUser.email || "—" }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHANGE PASSWORD CARD -->
      <div class="col-lg-8 d-flex">
        <div class="card flex-fill">
          <div class="card-header pb-0">
            <h6 class="mb-0">Change Password</h6>
          </div>
          <div class="card-body">
            <!-- info text above fields -->
            <div class="alert alert-info mb-4 bg-secondary text-white">
              Changing this password will update your admin account password.
            </div>

            <!-- result alert -->
            <div
              v-if="passwordMessage"
              :class="[
                'alert',
                passwordType === 'success'
                  ? 'alert-success'
                  : 'alert-danger',
              ]"
            >
              {{ passwordMessage }}
            </div>

            <form @submit.prevent="handleChangePassword">
              <div class="row">
                <!-- current password -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">Current Password</label>
                  <div class="position-relative">
                    <input
                      v-model="passwordForm.current_password"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Current Password"
                      style="padding-right: 2.5rem;"
                    />
                    <span
                      class="position-absolute top-50 end-0 translate-middle-y me-3"
                      style="cursor: pointer; font-size: 1.1rem; color: #000;"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      👁
                    </span>
                  </div>
                </div>

                <!-- new password -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">New Password</label>
                  <div class="position-relative">
                    <input
                      v-model="passwordForm.new_password"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="New Password"
                      style="padding-right: 2.5rem;"
                    />
                    <span
                      class="position-absolute top-50 end-0 translate-middle-y me-3"
                      style="cursor: pointer; font-size: 1.1rem; color: #000;"
                      @click="showNewPassword = !showNewPassword"
                    >
                      👁
                    </span>
                  </div>
                </div>

                <!-- confirm password -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Confirm New Password</label>
                  <div class="position-relative">
                    <input
                      v-model="passwordForm.new_password_confirmation"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Confirm New Password"
                      style="padding-right: 2.5rem;"
                    />
                    <span
                      class="position-absolute top-50 end-0 translate-middle-y me-3"
                      style="cursor: pointer; font-size: 1.1rem; color: #000;"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      👁
                    </span>
                  </div>
                </div>
              </div>

              <ArgonButton
                class="mt-3"
                color="success"
                variant="gradient"
                :disabled="passwordLoading"
                fullWidth
              >
                {{ passwordLoading ? "Updating..." : "Update Password" }}
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

