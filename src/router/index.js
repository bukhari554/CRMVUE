import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { adminGuard, userGuard, guestGuard } from './Guard.js'
import AdminDashboard from '@/views/Admin/AdminDashboard.vue'
import AdminUsers from '@/views/Admin/User.vue'
import AdminSettings from '@/views/Admin/Setting.vue'
import AdminSignin from '@/views/Admin/AdminSignin.vue'
import UserDashboard from '@/views/User/UserDashboard.vue'
import UserProfile from '@/views/User/Profile.vue'
import UserTickets from '@/views/User/ticket.vue'
import Signin from '@/views/User/Signin.vue'
import Signup from '@/views/User/Signup.vue'
import NotFound from '@/views/NotFound.vue'

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
  { path: '/admin/user', name: 'AdminUser', component: AdminUsers },
  { path: '/admin/settings', name: 'AdminSettings', component: AdminSettings },
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
