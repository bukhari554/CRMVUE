import { createStore } from "vuex";
import { APP_CONFIG } from '@/Data/appConfig.js'; // Import karein

export default createStore({
  state: {
    hideConfigButton: false,
    isPinned: false,
    showConfig: false,
    sidebarType: "bg-white",
    mcolor: "",
    darkMode: false,
    isNavFixed: false,
    isAbsolute: false,
    showNavs: true,
    showSidenav: true,
    showNavbar: true,
    showFooter: true,
    showMain: true,
    layout: "default",
    
    // ==================== AUTHENTICATION STATE ====================
    isAuthenticated: false,
    token: null,
    user: null,
    apiKey: null,
    
    // ==================== COMPANY INFO STATE ==================== 
    companyName: APP_CONFIG.appName || "ABC Forex Trading", // Config se initialize
    logoUrl: APP_CONFIG.logo || "/img/logo.png", // Config se initialize
  },
  
  mutations: {
    // ==================== UI MUTATIONS ====================
    toggleConfigurator(state) {
      state.showConfig = !state.showConfig;
    },
    sidebarMinimize(state) {
      let sidenav_show = document.querySelector("#app");
      if (state.isPinned) {
        sidenav_show.classList.add("g-sidenav-hidden");
        sidenav_show.classList.remove("g-sidenav-pinned");
        state.isPinned = false;
      } else {
        sidenav_show.classList.add("g-sidenav-pinned");
        sidenav_show.classList.remove("g-sidenav-hidden");
        state.isPinned = true;
      }
    },
    sidebarType(state, payload) {
      state.sidebarType = payload;
    },
    navbarFixed(state) {
      if (state.isNavFixed === false) {
        state.isNavFixed = true;
      } else {
        state.isNavFixed = false;
      }
    },
    setShowSidenav(state, value) {
      state.showSidenav = value;
    },
    setShowNavbar(state, value) {
      state.showNavbar = value;
    },
    setShowFooter(state, value) {
      state.showFooter = value;
    },
    setHideConfigButton(state, value) {
      state.hideConfigButton = value;
    },

    // ==================== COMPANY INFO MUTATIONS ====================
    setCompanyName(state, name) {
      state.companyName = name;
      localStorage.setItem("company_name", name);
    },
    setLogoUrl(state, url) {
      state.logoUrl = url;
      localStorage.setItem("logo_url", url);
    },

    // ==================== AUTHENTICATION MUTATIONS ====================
    
    /**
     * Set authentication data (login)
     * Called after successful login/signup
     */
    setAuth(state, { token, user, apiKey }) {
      console.log('🔐 setAuth mutation called', { token, user, apiKey });
      
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      state.apiKey = apiKey || null;
      
      // Store in localStorage for persistence across page reloads
      if (token) {
        localStorage.setItem("auth_token", token);
        console.log('✅ Token saved to localStorage');
      }
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
        console.log('✅ User saved to localStorage');
      }
      if (apiKey) {
        localStorage.setItem("auth_api_key", apiKey);
        console.log('✅ API Key saved to localStorage');
      }
    },

    /**
     * Clear authentication data (logout)
     */
    clearAuth(state) {
      console.log('🚪 clearAuth mutation called - logging out');
      
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.apiKey = null;
      
      // Remove from localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_api_key");
      
      console.log('✅ Auth cleared from store and localStorage');
    },

    /**
     * Initialize authentication from localStorage
     * Called on app startup
     */
    initializeAuth(state) {
      console.log('🔄 initializeAuth mutation called');
      
      // Check localStorage on app initialization
      const token = localStorage.getItem("auth_token");
      const userStr = localStorage.getItem("auth_user");
      const apiKey = localStorage.getItem("auth_api_key");
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          
          state.isAuthenticated = true;
          state.token = token;
          state.user = user;
          state.apiKey = apiKey;
          
          console.log('✅ Auth restored from localStorage', {
            userId: user.id,
            userRole: user.role,
            hasToken: !!token,
            hasApiKey: !!apiKey
          });
        } catch (e) {
          console.error('❌ Failed to parse user data from localStorage', e);
          // If parsing fails, clear auth
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          state.apiKey = null;
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_api_key");
        }
      } else {
        console.log('ℹ️ No auth data found in localStorage');
      }
    },

    /**
     * Update user data (for profile updates)
     */
    updateUser(state, userData) {
      console.log('📝 updateUser mutation called', userData);
      
      if (state.user) {
        state.user = { ...state.user, ...userData };
        localStorage.setItem("auth_user", JSON.stringify(state.user));
        console.log('✅ User data updated');
      }
    },
  },
  
  actions: {
    // ==================== UI ACTIONS ====================
    toggleSidebarColor({ commit }, payload) {
      commit("sidebarType", payload);
    },

    // ==================== AUTHENTICATION ACTIONS ====================
    
    /**
     * Login action
     * @param {Object} payload - { token, user, apiKey }
     */
    login({ commit }, { token, user, apiKey }) {
      console.log('🔑 Login action called');
      commit("setAuth", { token, user, apiKey });
    },

    /**
     * Logout action
     */
    logout({ commit }) {
      console.log('👋 Logout action called');
      commit("clearAuth");
    },

    /**
     * Initialize authentication on app startup
     */
    initializeAuth({ commit }) {
      console.log('🚀 Initialize auth action called');
      commit("initializeAuth");
    },

    /**
     * Update user profile
     * @param {Object} userData - Updated user data
     */
    updateUserProfile({ commit }, userData) {
      console.log('👤 Update user profile action called');
      commit("updateUser", userData);
    },
  },
  
  getters: {
    // ==================== UI GETTERS ====================
    sidebarType: (state) => state.sidebarType,
    darkMode: (state) => state.darkMode,
    
    // ==================== AUTHENTICATION GETTERS ====================
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated: (state) => state.isAuthenticated,
    
    /**
     * Check if user is logged in (alias for isAuthenticated)
     */
    isLoggedIn: (state) => state.isAuthenticated,
    
    /**
     * Get current user object
     */
    currentUser: (state) => state.user,
    
    /**
     * Get authentication token
     */
    authToken: (state) => state.token,
    
    /**
     * Get API key
     */
    apiKey: (state) => state.apiKey,
    
    /**
     * Get user role (admin, user, etc.)
     */
    userRole: (state) => {
      if (!state.user) return null;
      return state.user.role || null;
    },
    
    /**
     * Get user ID
     */
    userId: (state) => {
      if (!state.user) return null;
      return state.user.id || null;
    },
    
    /**
     * Get user email
     */
    userEmail: (state) => {
      if (!state.user) return null;
      return state.user.email || null;
    },
    
    /**
     * Check if current user is admin
     */
    isAdmin: (state) => {
      if (!state.user) return false;
      return state.user.role === 'admin';
    },
    
    /**
     * Get full auth headers for API calls
     */
    authHeaders: (state) => {
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
      }
      
      return headers;
    },
  },
});