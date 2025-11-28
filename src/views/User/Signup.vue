<script setup>
import { onBeforeUnmount, onBeforeMount, ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { countries } from "@/Data/countries.js";
import { APP_CONFIG } from "@/Data/appConfig.js";
import Navbar from "@/examples/PageLayout/Navbarsignup.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const router = useRouter();

const accountTypes = ref([
  { label: "Individual", value: "individual" },
  { label: "Company", value: "company" }
]);
const currencies = ref(["USD"]);

// Form data object
const formData = ref({
  account_type: "",
  company_name: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirmation: "",
  currency: "USD",
  country: "",
  country_code: "",
  telephone: "",
  agree: false
});

const loading = ref(false);
const message = ref("");
const messageType = ref("");
const telephoneError = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Dropdown states
const showCountryDropdown = ref(false);
const showCountryCodeDropdown = ref(false);
const showCurrencyDropdown = ref(false);

// Search functionality
const countrySearch = ref("");
const countryCodeSearch = ref("");

// Get unique country codes for dropdown
const uniqueCountryCodes = ref(
  [...new Set(countries.map(c => c.code))].sort()
);

// Computed property to check if company account is selected
const isCompanyAccount = computed(() => {
  return formData.value.account_type === "company";
});

// Filtered countries based on search
const filteredCountries = computed(() => {
  if (!countrySearch.value) return countries;
  return countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.value.toLowerCase())
  );
});

// Filtered country codes based on search
const filteredCountryCodes = computed(() => {
  if (!countryCodeSearch.value) return uniqueCountryCodes.value;
  return uniqueCountryCodes.value.filter(code => 
    code.toLowerCase().includes(countryCodeSearch.value.toLowerCase())
  );
});

// Get country by code
const getCountryByCode = (code) => {
  return countries.find(c => c.code === code);
};

// When country is selected, update country code
const selectCountry = (countryName) => {
  formData.value.country = countryName;
  const selected = countries.find(c => c.name === countryName);
  if (selected) {
    formData.value.country_code = selected.code;
  }
  showCountryDropdown.value = false;
  countrySearch.value = "";
};

// When country code is selected/changed, update country name
const selectCountryCode = (code) => {
  formData.value.country_code = code;
  const country = getCountryByCode(code);
  if (country) {
    formData.value.country = country.name;
  }
  showCountryCodeDropdown.value = false;
  countryCodeSearch.value = "";
};

// Select currency
const selectCurrency = (currency) => {
  formData.value.currency = currency;
  showCurrencyDropdown.value = false;
};

// Validate phone number based on country
const validatePhoneNumber = () => {
  telephoneError.value = "";
  const phone = formData.value.telephone.trim();

  if (!phone) return true;

  // Only allow digits, spaces, parentheses, and hyphens - no + sign
  if (!/^[\d\s()-]*$/.test(phone)) {
    telephoneError.value = "Only Digits are Allowed";
    return false;
  }

  // Extract only digits to check length
  const digitsOnly = phone.replace(/\D/g, "");
  
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    telephoneError.value = "Mobile No. should be of 9-15 digits";
    return false;
  }

  return true;
};

// Prevent leading spaces in input fields (for name fields)
const preventLeadingSpace = (event, fieldName) => {
  const value = event.target.value;
  if (value && value[0] === ' ') {
    formData.value[fieldName] = value.trimStart();
  }
};

// Prevent all spaces in email and password fields
const preventSpaces = (event, fieldName) => {
  const value = event.target.value;
  // Remove all spaces (start, middle, end) from the value
  formData.value[fieldName] = value.replace(/\s/g, '');
};

onBeforeMount(() => {
  // Initialize auth if not already done
  if (!store.state.isAuthenticated) {
    store.commit("initializeAuth");
  }
  
  // Redirect if already authenticated
  if (store.getters.isAuthenticated) {
    router.push("/dashboard-default");
    return;
  }
  
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
});

// Submit signup form function
const submitsignup = async () => {
  // Clear previous messages
  message.value = "";
  messageType.value = "";

  // Validation checks
  const requiredFields = {
    account_type: "Account Type",
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email",
    password: "Password",
    password_confirmation: "Confirm Password",
    currency: "Currency",
    country: "Country",
    country_code: "Country Code",
    telephone: "Mobile Number"
  };

  // Add company_name to required fields if company account
  if (isCompanyAccount.value) {
    requiredFields.company_name = "Company Name";
  }

  const sanitize = value =>
    typeof value === "string" ? value.trim() : value;

  for (const [field, label] of Object.entries(requiredFields)) {
    const value = sanitize(formData.value[field]);
    if (!value) {
      message.value = `${label} is required`;
      messageType.value = "error";
      return;
    }
  }

  if (formData.value.password !== formData.value.password_confirmation) {
    message.value = "Passwords do not match";
    messageType.value = "error";
    return;
  }

  if (!formData.value.agree) {
    message.value = "Please agree to Terms and Conditions";
    messageType.value = "error";
    return;
  }

  if (formData.value.telephone && !validatePhoneNumber()) {
    message.value = telephoneError.value;
    messageType.value = "error";
    return;
  }

  loading.value = true;

  try {
    const payload = {
      account_type: sanitize(formData.value.account_type),
      first_name: sanitize(formData.value.first_name),
      last_name: sanitize(formData.value.last_name),
      email: sanitize(formData.value.email),
      password: formData.value.password,
      password_confirmation: formData.value.password_confirmation,
      currency: sanitize(formData.value.currency),
      country: sanitize(formData.value.country),
      country_code: sanitize(formData.value.country_code),
      telephone: sanitize(formData.value.telephone)
    };

    // Add company_name to payload if company account
    if (isCompanyAccount.value) {
      payload.company_name = sanitize(formData.value.company_name);
    }

    console.log("Sending payload:", payload); // Debug log

    const response = await fetch(`${APP_CONFIG.baseApiUrl}/client/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", response.status); // Debug log

    const data = await response.json();
    console.log("Response data:", data); // Debug log

    if (response.ok && data?.success) {
      // Extract token, user, and api_key from response structure
      const token = data?.data?.token;
      const user = data?.data?.user;
      const apiKey = data?.data?.api_key;
      
      // Auto-login after successful signup
      if (token && user) {
        store.dispatch("login", { token, user, apiKey });
        message.value = "Sign up successful! Redirecting to dashboard...";
        messageType.value = "success";
        formData.value = {
          account_type: "",
          company_name: "",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          password_confirmation: "",
          currency: "USD",
          country: "",
          country_code: "",
          telephone: "",
          agree: false
        };
        setTimeout(() => {
          router.push("/dashboard-default");
        }, 2000);
      } else {
        message.value = "Sign up successful. Please login.";
        messageType.value = "error";
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      }
    } else {
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0];
        message.value = Array.isArray(firstError) ? firstError[0] : firstError;
      } else {
        message.value = data.message || "Something went wrong";
      }
      messageType.value = "ERROR";
    }
  } catch (error) {
    console.error("Full error:", error); // Debug log
    message.value = "(ERROR 503 SERVICE UNAVAILABLE)";
    messageType.value = "ERROR";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <!-- Navbar -->
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar isBtn="bg-gradient-light" />
      </div>
    </div>
  </div>

  <main class="main-content mt-0">
    <div class="page-header align-items-start min-vh-50 pt-5 pb-11 m-3 border-radius-lg">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-5 text-center mx-auto">
            <h1 class="text-black mb-2 mt-5">Welcome!</h1>
            <p class="text-lead text-black">Create a new account or login to your existing account</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row mt-lg-n10 mt-md-n11 mt-n10 justify-content-center">
        <div class="col-xl-7 col-lg-8 col-md-10 mx-auto">
          <div class="card z-index-0">
            <div class="card-header text-center pt-4">
              <h5>Register Your Account</h5>
            </div>

            <div v-if="message" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-danger', 'mx-3', 'mt-3']">
              {{ message }}
            </div>

            <div class="card-body">
              <form role="form" @submit.prevent="submitsignup">

                <!-- Account Type -->
                <div class="mb-3">
                  <label class="form-label">Account Type</label>
                  <select v-model="formData.account_type" class="form-control" required>
                    <option value="">Select Account Type</option>
                    <option 
                      v-for="type in accountTypes" 
                      :key="type.value" 
                      :value="type.value"
                    >
                      {{ type.label }}
                    </option>
                  </select>
                </div>

                <!-- Company Name (shown only if company account selected) -->
                <div v-if="isCompanyAccount" class="mb-3">
                  <argon-input 
                    v-model="formData.company_name" 
                    placeholder="Company Name" 
                    @input="preventLeadingSpace($event, 'company_name')"
                  />
                </div>

                <!-- First and Last Name -->
                <div class="row">
                  <div class="col-md-6">
                    <argon-input 
                      v-model="formData.first_name" 
                      placeholder="First Name" 
                      @input="preventLeadingSpace($event, 'first_name')"
                    />
                  </div>
                  <div class="col-md-6">
                    <argon-input 
                      v-model="formData.last_name" 
                      placeholder="Last Name" 
                      @input="preventLeadingSpace($event, 'last_name')"
                    />
                  </div>
                </div>

                <!-- Email -->
                <div class="mb-3">
                  <input 
                    v-model="formData.email" 
                    type="email" 
                    class="form-control"
                    placeholder="Email" 
                    @input="preventSpaces($event, 'email')"
                  />
                </div>

                <!-- Country with Custom Dropdown -->
                <div class="mb-3 position-relative">
                  <label class="form-label">Country</label>
                  <div 
                    class="form-control d-flex justify-content-between align-items-center" 
                    style="cursor: pointer;"
                    @click="showCountryDropdown = !showCountryDropdown"
                  >
                    <span>{{ formData.country || 'Select Country' }}</span>
                    <i :class="showCountryDropdown ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                  </div>
                  
                  <!-- Custom Dropdown -->
                  <div v-if="showCountryDropdown" class="custom-dropdown">
                    <input 
                      v-model="countrySearch" 
                      type="text" 
                      class="form-control mb-2" 
                      placeholder="Search country..."
                      @click.stop
                    />
                    <div class="dropdown-list">
                      <div 
                        v-for="country in filteredCountries" 
                        :key="country.name"
                        class="dropdown-item"
                        @click="selectCountry(country.name)"
                      >
                        {{ country.name }}
                      </div>
                      <div v-if="filteredCountries.length === 0" class="dropdown-item text-muted">
                        No results found
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Telephone -->
                <div class="row">
                  <div class="col-md-5">
                    <label class="form-label">Country Code</label>
                    <div class="position-relative">
                      <div 
                        class="form-control d-flex justify-content-between align-items-center" 
                        style="cursor: pointer;"
                        @click="showCountryCodeDropdown = !showCountryCodeDropdown"
                      >
                        <span>{{ formData.country_code || 'Select Code' }}</span>
                        <i :class="showCountryCodeDropdown ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                      </div>
                      
                      <!-- Custom Dropdown for Country Code -->
                      <div v-if="showCountryCodeDropdown" class="custom-dropdown">
                        <input 
                          v-model="countryCodeSearch" 
                          type="text" 
                          class="form-control mb-2" 
                          placeholder="Search code..."
                          @click.stop
                        />
                        <div class="dropdown-list">
                          <div 
                            v-for="code in filteredCountryCodes" 
                            :key="code"
                            class="dropdown-item"
                            @click="selectCountryCode(code)"
                          >
                            {{ code }}
                          </div>
                          <div v-if="filteredCountryCodes.length === 0" class="dropdown-item text-muted">
                            No results found
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-7">
                    <label class="form-label">Mobile Number</label>
                    <argon-input 
                      v-model="formData.telephone" 
                      type="number" 
                      :placeholder="`Mobile (${formData.country_code || 'XX'})`" 
                      @blur="validatePhoneNumber" 
                    />
                    <small v-if="telephoneError" class="text-danger d-block mt-1">{{ telephoneError }}</small>
                  </div>
                </div>

                <!-- Currency with Custom Dropdown (No Search) -->
                <div class="mb-3 position-relative">
                  <label class="form-label">Currency</label>
                  <div 
                    class="form-control d-flex justify-content-between align-items-center" 
                    style="cursor: pointer;"
                    @click="showCurrencyDropdown = !showCurrencyDropdown"
                  >
                    <span>{{ formData.currency || 'Select Currency' }}</span>
                    <i :class="showCurrencyDropdown ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                  </div>
                  
                  <!-- Currency -->
                  <div v-if="showCurrencyDropdown" class="custom-dropdown">
                    <div class="dropdown-list">
                      <div 
                        v-for="currency in currencies" 
                        :key="currency"
                        class="dropdown-item"
                        @click="selectCurrency(currency)"
                      >
                        {{ currency }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Password with Eye Icon -->
                <div class="row">
                  <div class="col-md-6">
                    <label class="form-label">Password</label>
                    <div class="position-relative">
                      <input 
                        v-model="formData.password" 
                        :type="showPassword ? 'text' : 'password'" 
                        class="form-control"
                        placeholder="Password"
                        @input="preventSpaces($event, 'password')"
                      />
                      <button 
                        type="button"
                        @click="showPassword = !showPassword"
                        class="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 pe-3"
                        style="z-index: 10;"
                      >
                        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Confirm Password</label>
                    <div class="position-relative">
                      <input 
                        v-model="formData.password_confirmation" 
                        :type="showConfirmPassword ? 'text' : 'password'" 
                        class="form-control"
                        placeholder="Confirm Password"
                        @input="preventSpaces($event, 'password_confirmation')"
                      />
                      <button 
                        type="button"
                        @click="showConfirmPassword = !showConfirmPassword"
                        class="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 pe-3"
                        style="z-index: 10;"
                      >
                        <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Agree Terms Checkbox -->
                <div class="form-check ps-0 mb-3 mt-3 d-flex align-items-start">
                  <input type="checkbox" 
                    id="agree" 
                    v-model="formData.agree" 
                    class="custom-checkbox"
                  />
                  <label class="form-check-label ms-2" for="agree" style="cursor: pointer;">
                    I confirm that I have read and understood the.
                    <a href="javascript:;" class="text-dark font-weight-bolder"> AML POLICY, </a>
                    <a href="javascript:;" class="text-dark font-weight-bolder">PRIVACY POLICY, </a>
                    <a href="javascript:;" class="text-dark font-weight-bolder">BONUS POLICY, </a>
                    <a href="javascript:;" class="text-dark font-weight-bolder">RISK DISCLOSURE, </a>
                    <a href="javascript:;" class="text-dark font-weight-bolder">CLIENT AGRREEMENT, </a>and
                    <a href="javascript:;" class="text-dark font-weight-bolder"> TERMS AND CONDITIONS </a>
                    I agree to be bound by all the terms and conditions outlined within them. I acknowledge that checking this box constitutes my formal and legally binding consent to these agreements. 
                  </label>  
                </div>


                <!-- Submit Button -->
                <div class="text-center">
                  <argon-button fullWidth color="dark" variant="gradient" class="my-4 mb-2" :disabled="loading">
                    {{ loading ? "Loading..." : "Register Now" }}
                  </argon-button>
                </div>

                <!-- Sign In Link -->
                <p class="text-sm mt-3 mb-0 text-center">
                  Already have an account? <a href="signin" class="text-dark font-weight-bolder">Sign in</a>
                </p>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <app-footer />
</template>

<style scoped>
.position-relative input {
  padding-right: 40px;
}

.custom-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
}

.dropdown-list {
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.text-muted {
  cursor: default;
}

.dropdown-item.text-muted:hover {
  background-color: transparent;
}

.custom-checkbox {
  width: 23px;
  height: 23px;
  accent-color: #0d6efd; /* checkbox color */
}

.form-check-label a {
  transition: color 0.2s ease;
}

.form-check-label a:hover {
  color: #0d6efd !important;
  text-decoration: underline;
}

</style>