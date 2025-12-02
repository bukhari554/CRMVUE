import store from '@/store'

export function adminGuard(to, from, next) {
  const isLoggedIn = store.getters.isLoggedIn
  const userRole = store.getters.userRole
  const token = store.getters.authToken

  console.log('Admin Guard:', { path: to.path, isLoggedIn, userRole, hasToken: !!token })

  if (to.path === '/admin-signin') {
    if (isLoggedIn && userRole === 'admin') return next('/admin/dashboard')
    if (isLoggedIn && userRole === 'user') return next('/user/dashboard')
    return next()
  }

  if (!isLoggedIn || !token) return next('/admin-signin')
  if (userRole !== 'admin') return next('/user/dashboard')
  return next()
}

export function userGuard(to, from, next) {
  const isLoggedIn = store.getters.isLoggedIn
  const userRole = store.getters.userRole
  const token = store.getters.authToken

  console.log('User Guard:', { path: to.path, isLoggedIn, userRole, hasToken: !!token })

  if (!isLoggedIn || !token) return next('/signin')
  if (userRole === 'admin') return next('/admin/dashboard')
  return next()
}

export function guestGuard(to, from, next) {
  const isLoggedIn = store.getters.isLoggedIn
  const userRole = store.getters.userRole

  console.log('Guest Guard:', { path: to.path, isLoggedIn, userRole })

  if (isLoggedIn) return next(userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard')
  return next()
}
