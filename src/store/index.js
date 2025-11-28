import { createStore } from "vuex";

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
    // Authentication state
    isAuthenticated: false,
    token: null,
    user: null,
    apiKey: null,
  },
  mutations: {
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
    // Authentication mutations
    setAuth(state, { token, user, apiKey }) {
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      state.apiKey = apiKey || null;
      // Store in localStorage for persistence
      if (token) {
        localStorage.setItem("auth_token", token);
      }
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
      if (apiKey) {
        localStorage.setItem("auth_api_key", apiKey);
      }
    },
    clearAuth(state) {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.apiKey = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_api_key");
    },
    initializeAuth(state) {
      // Check localStorage on app initialization
      const token = localStorage.getItem("auth_token");
      const userStr = localStorage.getItem("auth_user");
      const apiKey = localStorage.getItem("auth_api_key");
      
      if (token && userStr) {
        try {
          state.isAuthenticated = true;
          state.token = token;
          state.user = JSON.parse(userStr);
          state.apiKey = apiKey;
        } catch (e) {
          // If parsing fails, clear auth
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          state.apiKey = null;
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_api_key");
        }
      }
    },
    // New mutations for user role
    setUser(state, user) {
      state.user = user;
      state.isAuthenticated = !!user;
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_api_key");
    }
  },
  actions: {
    toggleSidebarColor({ commit }, payload) {
      commit("sidebarType", payload);
    },
    login({ commit }, { token, user, apiKey }) {
      commit("setAuth", { token, user, apiKey });
    },
    logout({ commit }) {
      commit("clearAuth");
    },
    initializeAuth({ commit }) {
      commit("initializeAuth");
    },
  },
  getters: {
    isAuthenticated: (state) => state.isAuthenticated,
    currentUser: (state) => state.user,
    authToken: (state) => state.token,
    apiKey: (state) => state.apiKey,
    // New getters for user role
    userRole: (state) => state.user?.role || null,
    isLoggedIn: (state) => state.isAuthenticated
  },
});