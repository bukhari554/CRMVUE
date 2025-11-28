import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import AdminDashboard from '@/views/Admin/AdminDashboard.vue'
import AdminUsers from '@/views/Admin/User.vue'
import AdminSettings from '@/views/Admin/Setting.vue'
import AdminSignin from '@/views/Admin/AdminSignin.vue'
import UserDashboard from '@/views/User/UserDashboard.vue'
import UserProfile from '@/views/User/Profile.vue'
import UserOrders from '@/views/User/Order.vue'
import Signin from '@/views/User/Signin.vue'
import Signup from '@/views/User/Signup.vue'

const routes = [

  // USER LOGIN ROUTES
  {
    path: '/signin',
    name: 'Signin',
    component: Signin,
    meta: { requiresGuest: true, userOnly: true }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: Signup,
    meta: { requiresGuest: true, userOnly: true }
  },

  // ADMIN LOGIN ROUTE
  {
    path: '/admin-signin',
    name: 'AdminSignin',
    component: AdminSignin,
    meta: { requiresGuest: true, adminOnly: true }
  },

  // ADMIN ROUTES 
  {
    path: '/admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings,
        meta: { requiresAuth: true, role: 'admin' }
      }
    ]
  },

  // USER ROUTES
  {
    path: '/user',
    component: UserDashboard,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'UserDashboard',
        component: UserDashboard,
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: { requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: UserOrders,
        meta: { requiresAuth: true }
      }
    ]
  },

  // DEFAULT ROUTE
  {
    path: '/',
    redirect: '/signin'
  },

  // BLANK PAGE FOR 404 
  {
    path: '/blank',
    name: 'BlankPage',
    component: {
      template: '<div></div>'
    }
  },

  // 404 - Redirect to Blank Page
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/blank'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// NAVIGATION GUARDS
router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters.isLoggedIn
  const userRole = store.getters.userRole

  // 1. Admin Routes Protection
  if (to.path.startsWith('/admin') && to.path !== '/admin-signin') {
    if (!isLoggedIn) {
      next('/blank')  
      return
    }

    if (userRole !== 'admin') {
      next('/blank') 
      return
    }

    next()
    return
  }

  // 2. User Routes Protection 
  if (to.path.startsWith('/user')) {
    if (!isLoggedIn) {
      next('/signin')
      return
    }

    next()
    return
  }

  // 3. Admin Signin Page 
  if (to.path === '/admin-signin') {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        next('/admin')
      } else {
        next('/blank')  
      }
      return
    }
    next()
    return
  }

  // 4. User Signin/Signup Pages
  if (to.path === '/signin' || to.path === '/signup') {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        next('/admin')
      } else {
        next('/user')
      }
      return
    }
    next()
    return
  }

  // 5. Default Route
  if (to.path === '/') {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        next('/admin')
        return
      }
      next('/user')
      return
    }
    next('/signin')
    return
  }

  next()
})

export default router