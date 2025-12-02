<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary position-relative overflow-hidden">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-6 col-md-8 text-center">
          <div class="mb-4">
            <h1 class="display-1 fw-bold text-white mb-0">404</h1>
            <h2 class="h3 text-white mb-4">Page Not Found</h2>
            <p class="text-white opacity-8 mb-4">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'NotFound',
  setup() {
    const store = useStore()
    
    // Store original values
    let originalSidenav = store.state.showSidenav
    let originalNavbar = store.state.showNavbar
    let originalFooter = store.state.showFooter
    let originalHideConfigButton = store.state.hideConfigButton
    
    onMounted(() => {
      // Hide sidebar, navbar, footer, and config button on 404 page
      originalSidenav = store.state.showSidenav
      originalNavbar = store.state.showNavbar
      originalFooter = store.state.showFooter
      originalHideConfigButton = store.state.hideConfigButton
      
      store.commit('setShowSidenav', false)
      store.commit('setShowNavbar', false)
      store.commit('setShowFooter', false)
      store.commit('setHideConfigButton', true)
    })
    
    onUnmounted(() => {
      // Restore original values when leaving 404 page
      store.commit('setShowSidenav', originalSidenav)
      store.commit('setShowNavbar', originalNavbar)
      store.commit('setShowFooter', originalFooter)
      store.commit('setHideConfigButton', originalHideConfigButton)
    })
  }
}
</script>

