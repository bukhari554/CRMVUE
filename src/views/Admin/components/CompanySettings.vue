<template>
  <div class="company-settings-card">
    <div class="card-header">
      <h5 class="mb-0">Company Settings</h5>
    </div>
    <div class="card-body">
      <div class="form-group mb-3">
        <label class="form-label">Company Name</label>
        <input 
          v-model="newCompanyName" 
          type="text" 
          class="form-control"
          placeholder="Enter company name"
        />
      </div>
      
      <div class="form-group mb-3">
        <label class="form-label">Logo URL</label>
        <input 
          v-model="newLogoUrl" 
          type="text" 
          class="form-control"
          placeholder="Enter logo URL (e.g., /img/logo.png)"
        />
      </div>
      
      <button @click="updateCompanyInfo" class="btn btn-primary w-100">
        Save Changes
      </button>

      <!-- Current Preview -->
      <div class="mt-4 pt-3 border-top">
        <p class="text-sm mb-2"><strong>Current Settings:</strong></p>
        <p class="text-sm mb-1">Company: {{ currentCompanyName }}</p>
        <div v-if="currentLogoUrl" class="mt-2">
          <img :src="currentLogoUrl" alt="Logo" style="max-height: 40px;" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const newCompanyName = ref('');
const newLogoUrl = ref('');

// Current values from store
const currentCompanyName = computed(() => store.state.companyName);
const currentLogoUrl = computed(() => store.state.logoUrl);

const updateCompanyInfo = () => {
  if (newCompanyName.value) {
    store.commit('setCompanyName', newCompanyName.value);
  }
  if (newLogoUrl.value) {
    store.commit('setLogoUrl', newLogoUrl.value);
  }
  
  // Clear inputs after saving
  newCompanyName.value = '';
  newLogoUrl.value = '';
  
  alert('Company information updated successfully!');
};
</script>

<style scoped>
.company-settings-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.card-body {
  padding: 1.5rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d2d6da;
  border-radius: 0.375rem;
}

.form-control:focus {
  border-color: #5e72e4;
  outline: none;
}

.btn-primary {
  background-color: #5e72e4;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #485ac7;
}
</style>