import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store/index.js'
import { adminGuard, userGuard, guestGuard } from './Guard.js'
import AdminDashboard from '@/views/Admin/AdminDashboard.vue'
import AdminSettings from '@/views/Admin/Settings.vue'
import AdminSignin from '@/views/Admin/AdminSignin.vue'
import UserDashboard from '@/views/User/UserDashboard.vue'
import UserProfile from '@/views/User/Profile.vue'
import UserTickets from '@/views/User/ticket.vue'
import Signin from '@/views/User/Signin.vue'
import Signup from '@/views/User/Signup.vue'
import NotFound from '@/views/NotFound.vue'
import Clients from '@/views/Admin/Clients.vue'
import Deposit from '@/views/Admin/Deposit.vue'
import KYCRequest from '@/views/Admin/KYCRequest.vue'
import AdminTickets from '@/views/Admin/AdminTickets.vue'
import Withdrawl from '@/views/Admin/Withdrawl.vue'
import AdminProfile from '@/views/Admin/AdminProfile.vue'
import AccountTypes from '@/views/Admin/AccountTypes.vue'
import PaymentMethods from '@/views/Admin/PaymentMethods.vue'
import ClientProfile from '@/views/Admin/ClientProfile.vue'
import Wallet from '@/views/User/Wallet.vue'
import UserKYC from '@/views/User/UserKYC.vue'
import TradingAccounts from '@/views/User/TradingAccounts.vue'
import MobileTrader from '@/views/User/components/MobileTrader.vue'
import IOSTrader from '@/views/User/components/IOSTrader.vue'
import WindowTrader from '@/views/User/components/WindowTrader.vue'
import UsefullTools from '@/views/User/components/UsefullTools.vue'
// Routes
const routes = [
  {
    path: '/',
    redirect: () => {
      const isLoggedIn = store.getters.isLoggedIn
      const userRole = store.getters.userRole
      if (isLoggedIn) {
        return userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'
      }
      return '/signin'
    }
  },
  { path: '/admin-signin', name: 'AdminSignin', component: AdminSignin },
  { path: '/admin/dashboard', name: 'AdminDashboard', component: AdminDashboard },
  { path: '/admin/settings', name: 'AdminSettings', component: AdminSettings },
  { path: '/admin/clients', name: 'Clients', component: Clients },
  { path: '/admin/clients/:id/profile', name: 'ClientProfile', component: ClientProfile },
  { path: '/admin/Deposit', name: 'Deposit', component: Deposit },
  { path: '/admin/kycrequest', name: 'KYCRequest', component: KYCRequest },
  { path: '/admin/admintickets', name: 'AdminTickets', component: AdminTickets },
  { path: '/admin/withdrawl', name: 'Withdrawl', component: Withdrawl },
  { path: '/admin/profile', name: 'AdminProfile', component: AdminProfile },
  { path: '/admin/account-types', name: 'AccountTypes', component: AccountTypes },
  { path: '/admin/payment-methods', name: 'PaymentMethods', component: PaymentMethods },
  { path: '/signin', name: 'Signin', component: Signin },
  { path: '/signup', name: 'Signup', component: Signup },
  { path: '/user/dashboard', name: 'UserDashboard', component: UserDashboard },
  { path: '/user/profile', name: 'UserProfile', component: UserProfile },
  { path: '/user/tickets', name: 'UserTickets', component: UserTickets },
  { path: '/user/wallet', name: 'Wallet', component: Wallet },
  { path: '/user/userkyc', name: 'UserKYC', component: UserKYC },
  { path: '/user/tradingaccounts', name: 'TradingAccounts', component: TradingAccounts },
  { path: '/user/mobiletrader', name: 'MobileTrader', component: MobileTrader },
  { path: '/user/iostrader', name: 'IOSTrader', component: IOSTrader },
  { path: '/user/windowtrader', name: 'WindowTrader', component: WindowTrader },
  { path: '/user/usefulltools', name: 'UsefullTools', component: UsefullTools },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
  
]


const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Global Navigation Guard
router.beforeEach((to, from, next) => {
  if (to.path.startsWith('/admin')) return adminGuard(to, from, next)
  if (to.path.startsWith('/user')) return userGuard(to, from, next)
  if (to.path === '/signin' || to.path === '/signup') return guestGuard(to, from, next)
  next()
})

export default router
