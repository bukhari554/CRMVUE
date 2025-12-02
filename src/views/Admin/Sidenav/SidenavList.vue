<script setup>
import { useRoute } from "vue-router";

import SidenavItem from "./SidenavItem.vue";

const getRoute = () => {
  const route = useRoute();
  const routeArr = route.path.split("/");
  return routeArr[1];
};
</script>
<template>
  <div
    class="collapse navbar-collapse w-auto h-auto h-100"
    id="sidenav-collapse-main"
  >
    <ul class="navbar-nav">
      <li class="nav-item">
        <sidenav-item
          to="/user/dashboard"
          :class="getRoute() === 'UserDashboard' ? 'active' : ''"
          navText="Dashboard"
        >
          <template v-slot:icon>
            <i class="ni ni-tv-2 text-primary text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/user/profile"
          :class="getRoute() === 'Profile' ? 'active' : ''"
          navText="Profile"
        >
          <template v-slot:icon>
            <i class="ni ni-single-02 text-warning text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/user/tickets"
          :class="getRoute() === 'ticket' ? 'active' : ''"
          navText="Support"
        >
          <template v-slot:icon>
            <i class="ni ni-chat-round text-success text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

<li class="nav-item">
  <sidenav-item
    to="/User/mywallet"
    :class="getRoute() === 'mywallet' ? 'active' : ''"
    navText="My Wallet"
  >
    <template v-slot:icon>
      <i class="ni ni-money-coins text-info text-sm opacity-10"></i>
    </template>
  </sidenav-item>
</li>

      <li class="nav-item">
        <sidenav-item
          to="/user/tradingaccounts"
          :class="getRoute() === 'tradingaccount' ? 'active' : ''"
          navText="Trading Accounts"
        >
          <template v-slot:icon>
            <i class="ni ni-chart-bar-32 text-dark text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/user/info"
          :class="getRoute() === 'info' ? 'active' : ''"
          navText="Information and Tools"
        >
          <template v-slot:icon>
            <i class="ni ni-bulb-61 text-danger text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
    </ul>
  </div>
</template>