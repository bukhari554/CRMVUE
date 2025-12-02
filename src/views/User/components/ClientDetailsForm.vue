<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useStore } from "vuex";
import ArgonButton from "@/components/ArgonButton.vue";
import { apiGet, apiPut } from "@/utils/api.js";
import { countries } from "@/Data/countries.js";

const store = useStore();
const currentUser = computed(() => store.getters.currentUser || {});

// --- form state ---
const form = ref({
  title: null,
  first_name: "",
  last_name: "",
  nationality: null,
  address: "",
  country: null,
  source_of_funds: null,
  declared_bankruptcy: null,
  is_usa_resident: null,
  is_pep: null,
});

// --- options ---
const titleOptions = ["Mr", "Mrs"];
const sourceOfFundsOptions = ["Salary", "Pension", "Investments", "Other"];
const countryOptions = computed(() => countries.map((c) => c.name));
const yesNoOptions = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

// --- ui state ---
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const clientData = ref(null);
const dataLoaded = ref(false);

// Module-level flag to prevent duplicate API calls across component instances (dev mode double mount)
let isLoadingRequest = false;

// ---- Load client details ONCE ----
const loadClientDetails = async () => {
  if (dataLoaded.value || loading.value || isLoadingRequest) {
    return;
  }

  isLoadingRequest = true;
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await apiGet("/client/client-details");
    const responseData = await response.json().catch(() => null);

    // Extract user data from different response structures
    let userData = null;

    if (responseData?.data?.user) {
      // Structure: { success: true, data: { user: {...} } }
      userData = responseData.data.user;
    } else if (responseData?.user) {
      // Structure: { user: {...} }
      userData = responseData.user;
    } else if (responseData?.data) {
      // Structure: { data: {...} }
      userData = responseData.data;
    } else if (responseData && typeof responseData === "object") {
      userData = responseData;
    }

    // Fallback to store if API returns nothing
    if (!response.ok || !userData || Object.keys(userData).length === 0) {
      userData = currentUser.value;
    }

    // Store the data
    clientData.value = userData || {};

    // Populate form
    if (clientData.value && Object.keys(clientData.value).length > 0) {
      // Helper to normalize title
      const getTitle = (val) => {
        if (!val) return null;
        const lower = String(val).trim().toLowerCase();
        return titleOptions.find(t => t.toLowerCase() === lower)?.toLowerCase() || lower;
      };

      // Helper for text (never null, always string)
      const getText = (val) => {
        if (val === null || val === undefined) return "";
        return String(val).trim();
      };

      // Helper for select (null if empty)
      const getSelect = (val) => {
        if (val === null || val === undefined) return null;
        if (typeof val === "string" && val.trim() === "") return null;
        return val;
      };

      // Helper for boolean (null if not set, true/false otherwise)
      const getBool = (val) => {
        if (val === null || val === undefined) return null;
        return !!val;
      };

      // Assign each field individually for better reactivity
      form.value.title = getTitle(clientData.value.title);
      form.value.first_name = getText(clientData.value.first_name);
      form.value.last_name = getText(clientData.value.last_name);
      form.value.nationality = getSelect(clientData.value.nationality);
      form.value.address = getText(clientData.value.address);
      form.value.country = getSelect(clientData.value.country);
      form.value.source_of_funds = getSelect(clientData.value.source_of_funds);
      form.value.declared_bankruptcy = getBool(clientData.value.declared_bankruptcy);
      form.value.is_usa_resident = getBool(clientData.value.is_usa_resident);
      form.value.is_pep = getBool(clientData.value.is_pep);

      await nextTick();
    }

    dataLoaded.value = true;
  } catch (err) {
    errorMessage.value = "Unable to load your profile details.";
    
    // Try fallback
    const fallback = currentUser.value;
    if (fallback && Object.keys(fallback).length > 0) {
      clientData.value = fallback;
      dataLoaded.value = true;
    }
  } finally {
    loading.value = false;
    isLoadingRequest = false;
  }
};

// Load on mount
onMounted(() => {
  loadClientDetails();
});

// ---- Save handler ----
const handleSave = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const payload = {
    title: form.value.title || null,
    first_name: form.value.first_name?.trim() || null,
    last_name: form.value.last_name?.trim() || null,
    nationality: form.value.nationality || null,
    address: form.value.address?.trim() || null,
    country: form.value.country || null,
    source_of_funds: form.value.source_of_funds || null,
    declared_bankruptcy: form.value.declared_bankruptcy === null ? false : !!form.value.declared_bankruptcy,
    is_usa_resident: form.value.is_usa_resident === null ? false : !!form.value.is_usa_resident,
    is_pep: form.value.is_pep === null ? false : !!form.value.is_pep,
  };

  saving.value = true;
  try {
    const response = await apiPut("/client/client-details", payload);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 422 && data?.errors) {
        const msg = Object.values(data.errors).flat().join(", ");
        throw new Error(msg || "Validation error");
      }
      throw new Error(data?.message || "Save failed");
    }

    successMessage.value = data?.message || "Details saved successfully.";
    clientData.value = { ...clientData.value, ...payload };
  } catch (err) {
    errorMessage.value = err.message || "Unable to save your details. Please try again.";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6 class="mb-0">Questionnaire</h6>
      <small class="text-muted">Personal Details</small>
    </div>
    <div class="card-body">
      <div v-if="loading" class="mb-3 text-muted">
        Loading your details...
      </div>

      <template v-else>

        <div class="row">
          <div class="col-md-3 mb-3">
            <label class="form-label">Title</label>
            <select v-model="form.title" class="form-select">
              <option :value="null">Select</option>
              <option
                v-for="t in titleOptions"
                :key="t"
                :value="t.toLowerCase()"
              >
                {{ t }}
              </option>
            </select>
          </div>

          <div class="col-md-4 mb-3">
            <label class="form-label">First Name</label>
            <input
              v-model="form.first_name"
              type="text"
              class="form-control"
            />
          </div>

          <div class="col-md-5 mb-3">
            <label class="form-label">Last Name</label>
            <input
              v-model="form.last_name"
              type="text"
              class="form-control"
            />
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Nationality</label>
            <select v-model="form.nationality" class="form-select">
              <option :value="null">Select</option>
              <option
                v-for="c in countryOptions"
                :key="`nat-${c}`"
                :value="c"
              >
                {{ c }}
              </option>
            </select>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Country</label>
            <select v-model="form.country" class="form-select">
              <option :value="null">Select</option>
              <option
                v-for="c in countryOptions"
                :key="`country-${c}`"
                :value="c"
              >
                {{ c }}
              </option>
            </select>
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">Address</label>
          <input
            v-model="form.address"
            type="text"
            class="form-control"
          />
        </div>

        <h5 class="mb-3 mt-4">Financial Information</h5>

        <div class="mb-4">
          <label class="form-label">Source of Funds</label>
          <select v-model="form.source_of_funds" class="form-select">
            <option :value="null">Select</option>
            <option
              v-for="s in sourceOfFundsOptions"
              :key="s"
              :value="s"
            >
              {{ s }}
            </option>
          </select>
        </div>

        <h5 class="mb-3 mt-4">Other Information</h5>

        <div class="mb-3">
          <label class="form-label">Have you ever declared bankruptcy?</label>
          <select
            v-model="form.declared_bankruptcy"
            class="form-select"
          >
            <option :value="null">Select</option>
            <option
              v-for="opt in yesNoOptions"
              :key="`bankruptcy-${opt.label}`"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Are you a USA resident or citizen?</label>
          <select
            v-model="form.is_usa_resident"
            class="form-select"
          >
            <option :value="null">Select</option>
            <option
              v-for="opt in yesNoOptions"
              :key="`usa-${opt.label}`"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="form-label">Are you a PEP or related to a PEP person?</label>
          <select
            v-model="form.is_pep"
            class="form-select"
          >
            <option :value="null">Select</option>
            <option
              v-for="opt in yesNoOptions"
              :key="`pep-${opt.label}`"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="d-flex justify-content-end">
          <ArgonButton
            color="success"
            variant="gradient"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? "Saving..." : "Save" }}
          </ArgonButton>
        </div>

        <div v-if="errorMessage" class="alert alert-danger mt-3">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success mt-3">
          {{ successMessage }}
        </div>
      </template>
    </div>
  </div>
</template>