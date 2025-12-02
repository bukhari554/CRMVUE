<script setup>
import { ref, onBeforeUnmount, onBeforeMount } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import Navbar from "@/examples/PageLayout/Navbarsignin.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonSwitch from "@/components/ArgonSwitch.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { APP_CONFIG } from "@/Data/appConfig.js";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const loading = ref(false);
const message = ref("");
const messageType = ref("");

onBeforeMount(() => {
  console.log('🔍 Admin Signin - Checking auth status...');
  
  // Initialize auth if not already done
  if (!store.state.isAuthenticated) {
    store.dispatch("initializeAuth");
  }
  
  // Redirect if already authenticated
  if (store.getters.isLoggedIn) {
    const userRole = store.getters.userRole;
    console.log('✅ Already logged in as:', userRole);
    
    if (userRole === 'admin') {
      router.push("/admin/dashboard");
    } else {
      // Non-admin trying to access admin signin
      router.push("/user/dashboard");
    }
    return;
  }
  
  // Setup page for signin
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

const handleLogin = async () => {
  console.log('🔐 Admin Login - Starting login process...');
  
  message.value = "";
  messageType.value = "";

  const trimmedEmail = email.value.trim();
  if (!trimmedEmail || !password.value) {
    message.value = "Email and password are required.";
    messageType.value = "error";
    console.log('❌ Validation failed - empty fields');
    return;
  }

  loading.value = true;

  try {
    console.log('📡 Calling ADMIN login endpoint: /admin/login');
    
    const response = await fetch(`${APP_CONFIG.baseApiUrl}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: trimmedEmail,
        password: password.value
      })
    });

    const data = await response.json().catch(() => null);
    
    console.log('📥 API Response:', {
      status: response.status,
      ok: response.ok,
      success: data?.success
    });

    if (response.ok && data?.success) {
      console.log('✅ Admin login successful!');
      
      // Extract data from admin login response
      // Response: { success: true, data: { admin: {...}, token: "..." } }
      const token = data?.data?.token;
      const adminData = data?.data?.admin;
      
      console.log('📦 Admin data extracted:', {
        hasToken: !!token,
        hasAdmin: !!adminData,
        adminId: adminData?.id,
        adminEmail: adminData?.email
      });
      
      // Verify we have required data
      if (!token || !adminData) {
        console.error('❌ Missing token or admin data');
        message.value = "Login failed. Incomplete data received.";
        messageType.value = "error";
        return;
      }
      
      // ⚠️ IMPORTANT: Since this is ADMIN LOGIN endpoint,
      // we ALWAYS set role as 'admin' (hardcoded)
      // This ensures only admins can access admin routes
      const user = {
        ...adminData,
        role: 'admin'  // ✅ Hardcoded because /admin/login only for admins
      };
      
      console.log('✅ User object created with admin role:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // Store authentication in Vuex
      store.dispatch("login", { token, user, apiKey: null });
      
      message.value = "Login successful! Redirecting to admin dashboard...";
      messageType.value = "success";
      
      console.log('💾 Admin auth saved to Vuex and localStorage');
      
      // Redirect to admin dashboard
      setTimeout(() => {
        console.log('🔄 Redirecting to /admin/dashboard...');
        router.push("/admin/dashboard");
      }, 1000);
      
    } else {
      console.log('❌ Admin login failed');
      
      const errorText = data?.message || 
        (response.status === 401 ? "Invalid admin credentials." : "Login failed.");
      
      message.value = errorText;
      messageType.value = "error";
    }
  } catch (error) {
    console.error('❌ Admin login error:', error);
    message.value = "Unable to reach the server. Please check your connection.";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar
          isBlur="blur  border-radius-lg my-3 py-2 start-0 end-0 mx-4 shadow"
          v-bind:darkMode="true"
          isBtn="bg-gradient-success"
        />
      </div>
    </div>
  </div>
  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row">
            <div
              class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0"
            >
              <div class="card card-plain">
                <div class="pb-0 card-header text-start">
                  <h4 class="font-weight-bolder text-center">Admin Sign In</h4>
                  <p class="mb-0 text-center">Enter your admin credentials to sign in</p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent="handleLogin">
                    <div
                      v-if="message"
                      :class="[
                        'alert',
                        messageType === 'success'
                          ? 'alert-success'
                          : 'alert-danger'
                      ]"
                    >
                      {{ message }}
                    </div>
                    <div class="mb-3">
                      <argon-input
                        id="email"
                        type="email"
                        placeholder="Admin Email"
                        name="email"
                        size="lg"
                        v-model="email"
                      />
                    </div>
                    <div class="mb-3">
                      <argon-input
                        id="password"
                        type="password"
                        placeholder="Admin Password"
                        name="password"
                        size="lg"
                        v-model="password"
                      />
                    </div>
                    <argon-switch
                      id="rememberMe"
                      name="remember-me"
                      v-model="rememberMe"
                      >Remember me</argon-switch
                    >

                    <div class="text-center">
                      <argon-button
                        class="mt-4"
                        variant="gradient"
                        color="success"
                        fullWidth
                        size="lg"
                        :disabled="loading"
                        >{{ loading ? "Signing in..." : "Sign in as Admin" }}</argon-button
                      >
                    </div>
                  </form>
                </div>
                <div class="px-1 pt-0 text-center card-footer px-lg-2">
                  <p class="mx-auto mb-4 text-sm">
                    Not an admin?
                    <a
                      href="/signin"
                      class="text-success text-gradient font-weight-bold"
                      >User Sign In</a
                    >
                  </p>
                </div>
              </div>
            </div>
            <div
              class="top-0 my-auto text-center col-6 d-lg-flex d-none h-100 pe-0 position-absolute end-0 justify-content-center flex-column"
            >
              <div
                class="position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center overflow-hidden"
                style="
                  background-image: url(&quot;https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/signin-ill.jpg&quot;);
                  background-size: cover;
                "
              >
                <span class="mask bg-gradient-success opacity-6"></span>
                <h4
                  class="mt-5 text-white font-weight-bolder position-relative"
                >
                  "Admin Access Only"
                </h4>
                <p class="text-white position-relative">
                  This is the admin portal. Please ensure you have the proper
                  credentials before attempting to sign in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>