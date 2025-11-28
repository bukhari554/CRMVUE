<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
const currentUser = computed(() => store.getters.currentUser);
const userName = computed(() => {
  if (currentUser.value) {
    return currentUser.value.name || 
           `${currentUser.value.first_name || ''} ${currentUser.value.last_name || ''}`.trim() ||
           currentUser.value.email;
  }
  return "User";
});
</script>
<template>
  <div class="card card-profile">
    <img
      src=""
      alt="Image placeholder"
      class="card-img-top"
    />
    <div class="row justify-content-center">
      <div class="col-4 col-lg-4 order-lg-2">
        <div class="mt-n4 mt-lg-n6 mb-4 mb-lg-0">
          <a href="javascript:;">
            <img
              src=""
              class="rounded-circle img-fluid border border-2 border-white"
            />
          </a>
        </div>
      </div>
    </div>
    <div class="card-header text-center border-0 pt-0 pt-lg-2 pb-4 pb-lg-3">
    </div>
    <div class="card-body pt-0">
      <div class="text-center mt-4">
        <h5>{{ userName }}</h5>
        <div class="h6 font-weight-300" v-if="currentUser?.country">
          <i class="ni location_pin mr-2"></i>{{ currentUser.country }}
        </div>
        <div class="h6 mt-4" v-if="currentUser?.account_type">
          <i class="ni business_briefcase-24 mr-2"></i>{{ currentUser.account_type.charAt(0).toUpperCase() + currentUser.account_type.slice(1) }} Account
        </div>
        <div v-if="currentUser?.email">
          <i class="ni ni-email-83 mr-2"></i>{{ currentUser.email }}
        </div>
        <div v-if="currentUser?.telephone" class="mt-2">
          <i class="ni ni-mobile-button mr-2"></i>{{ currentUser.country_code }} {{ currentUser.telephone }}
        </div>
      </div>
    </div>
  </div>
</template>
