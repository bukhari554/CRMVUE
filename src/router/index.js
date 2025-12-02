import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { adminGuard, userGuard, guestGuard } from './Guard.js'
import AdminDashboard from '@/views/Admin/AdminDashboard.vue'
import AdminSettings from '@/views/Admin/Setting.vue'
import AdminSignin from '@/views/Admin/AdminSignin.vue'
import UserDashboard from '@/views/User/UserDashboard.vue'
import UserProfile from '@/views/User/Profile.vue'
import UserTickets from '@/views/User/ticket.vue'
import Signin from '@/views/User/Signin.vue'
import Signup from '@/views/User/Signup.vue'
import NotFound from '@/views/NotFound.vue'
import ClientAlerts from '@/views/Admin/ClientAlerts.vue'
import Clients from '@/views/Admin/Clients.vue'
import Deposit from '@/views/Admin/Deposit.vue'
import IBPortal from '@/views/Admin/IBPortal.vue'
import KYCRequest from '@/views/Admin/KYCRequest.vue'
import SubAdmin from '@/views/Admin/SubAdmin.vue'
import AdminTickets from '@/views/Admin/AdminTickets.vue'
import Withdrawl from '@/views/Admin/Withdrawl.vue'
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
  { path: '/admin/clientalerts', name: 'ClientAlerts', component: ClientAlerts },
  { path: '/admin/clients', name: 'Clients', component: Clients },
  { path: '/admin/Deposit', name: 'Deposit', component: Deposit },
  { path: '/admin/ibportal', name: 'IBPortal', component: IBPortal },
  { path: '/admin/kycrequest', name: 'KYCRequest', component: KYCRequest },
  { path: '/admin/subadmin', name: 'SubAdmin', component: SubAdmin },
  { path: '/admin/admintickets', name: 'AdminTickets', component: AdminTickets },
  { path: '/admin/withdrawl', name: 'Withdrawl', component: Withdrawl },
  { path: '/signin', name: 'Signin', component: Signin },
  { path: '/signup', name: 'Signup', component: Signup },
  { path: '/user/dashboard', name: 'UserDashboard', component: UserDashboard },
  { path: '/user/profile', name: 'UserProfile', component: UserProfile },
  { path: '/user/tickets', name: 'UserTickets', component: UserTickets },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

// Router instance
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
