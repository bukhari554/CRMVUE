import { createApp } from "vue";
import UserApp from "@/views/User/UserApp.vue";
import AdminApp from "@/views/Admin/AdminApp.vue";
import store from "./store";
import router from "./router";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import ArgonDashboard from "./argon-dashboard";

// Initialize authentication state from localStorage
store.dispatch("initializeAuth");

// Determine which app to mount based on user role or route
const isAdmin = store.getters.isAdmin; // or however you determine admin status

if (isAdmin) {
  const adminAppInstance = createApp(AdminApp);
  adminAppInstance.use(store);
  adminAppInstance.use(router);
  adminAppInstance.use(ArgonDashboard);
  adminAppInstance.mount("#app");
} else {
  const userAppInstance = createApp(UserApp);
  userAppInstance.use(store);
  userAppInstance.use(router);
  userAppInstance.use(ArgonDashboard);
  userAppInstance.mount("#app");
}