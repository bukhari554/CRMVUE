<script setup>
import { computed, ref, onBeforeMount, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { apiPost } from "@/utils/api.js";

const body = document.getElementsByTagName("body")[0];
const store = useStore();

const currentUser = computed(() => store.getters.currentUser || {});

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
};

const profileRows = computed(() => {
  const user = currentUser.value;
  const rows = [
    { label: "ID", value: user.id },
    { label: "Name", value: user.name },
    { label: "Account Type", value: user.account_type },
    { label: "Company Name", value: user.company_name },
    { label: "Title", value: user.title },
    { label: "First Name", value: user.first_name },
    { label: "Last Name", value: user.last_name },
    { label: "Email", value: user.email },
    { label: "Email Verified At", value: user.email_verified_at ? new Date(user.email_verified_at).toLocaleString() : null },
    { label: "Currency", value: user.currency },
    { label: "Country", value: user.country },
    { label: "Country Code", value: user.country_code },
    { label: "Telephone", value: user.telephone },
    { label: "Nationality", value: user.nationality },
    { label: "Address", value: user.address },
    { label: "Source of Funds", value: user.source_of_funds },
    { label: "Declared Bankruptcy", value: user.declared_bankruptcy },
    { label: "USA Resident", value: user.is_usa_resident },
    { label: "Politically Exposed (PEP)", value: user.is_pep },
    { label: "Created At", value: user.created_at ? new Date(user.created_at).toLocaleString() : null },
    { label: "Updated At", value: user.updated_at ? new Date(user.updated_at).toLocaleString() : null },
  ];

  return rows.filter((row) => row.value !== undefined);
});

const passwordForm = ref({
  current_password: "",
  new_password: "",
  new_password_confirmation: "",
});
const passwordMessage = ref("");
const passwordType = ref("");
const passwordLoading = ref(false);

const handleChangePassword = async () => {
  passwordMessage.value = "";
  passwordType.value = "";

  if (!passwordForm.value.current_password || !passwordForm.value.new_password || !passwordForm.value.new_password_confirmation) {
    passwordMessage.value = "All password fields are required.";
    passwordType.value = "error";
    return;
  }

  if (passwordForm.value.new_password !== passwordForm.value.new_password_confirmation) {
    passwordMessage.value = "New password and confirmation must match.";
    passwordType.value = "error";
    return;
  }

  passwordLoading.value = true;
  try {
    const response = await apiPost("/client/change-password", {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
      new_password_confirmation: passwordForm.value.new_password_confirmation,
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
        (response.status === 422 ? "Validation failed. Please check your input." : "Unable to change password.");
      passwordType.value = "error";
    }
  } catch (error) {
    console.error("Password change error:", error);
    passwordMessage.value = "Unable to change password. Please try again.";
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
    <div class="row">
      <div class="col-lg-8">
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">Profile Details</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm align-items-center mb-0">
                <tbody>
                  <tr v-for="row in profileRows" :key="row.label">
                    <th class="text-uppercase text-xs text-secondary">{{ row.label }}</th>
                    <td class="text-sm">{{ formatValue(row.value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">Change Password</h6>
          </div>
          <div class="card-body">
            <div
              v-if="passwordMessage"
              :class="['alert', passwordType === 'success' ? 'alert-success' : 'alert-danger']"
            >
              {{ passwordMessage }}
            </div>
            <form @submit.prevent="handleChangePassword">
              <div class="row">
                <div class="col-md-12 mb-3">
                  <label class="form-label">Current Password</label>
                  <argon-input
                    v-model="passwordForm.current_password"
                    type="password"
                    placeholder="Current Password"
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">New Password</label>
                  <argon-input
                    v-model="passwordForm.new_password"
                    type="password"
                    placeholder="New Password"
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Confirm New Password</label>
                  <argon-input
                    v-model="passwordForm.new_password_confirmation"
                    type="password"
                    placeholder="Confirm New Password"
                  />
                </div>
              </div>
              <argon-button
                class="mt-3"
                color="success"
                variant="gradient"
                :disabled="passwordLoading"
                fullWidth
              >
                {{ passwordLoading ? "Updating..." : "Update Password" }}
              </argon-button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <profile-card />
      </div>
    </div>
  </main>
</template>
