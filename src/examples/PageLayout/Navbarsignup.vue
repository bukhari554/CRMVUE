<script setup>
defineProps({

});
</script>

<template>
  <nav
    class="navbar navbar-expand-lg top-0 z-index-3 position-absolute mt-4 shadow-none my-2 w-100"
    style="background-color: #f5f5f5; border-radius: 12px;" 
  >
    <div class="container ps-2 pe-0">
      <router-link
        class="navbar-brand font-weight-bolder ms-lg-0 ms-3"
        to="/"
        style="color: #000000;"
      >
        <a href="https://www.tradewithshaw.com/wp-content/uploads/2025/01/cropped-WhatsApp_Image_2025-01-27_at_6-32x32.webp" target="_blank" rel="noopener">
          <img src="https://www.tradewithshaw.com/wp-content/uploads/2025/01/cropped-WhatsApp_Image_2025-01-27_at_6-32x32.webp" alt="image description">
        </a>
      </router-link>

      <button
        class="shadow-none navbar-toggler ms-2"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navigation"
        aria-controls="navigation"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="mt-2 navbar-toggler-icon">
          <span class="navbar-toggler-bar bar1" style="background-color: #000000;"></span>
          <span class="navbar-toggler-bar bar2" style="background-color: #000000;"></span>
          <span class="navbar-toggler-bar bar3" style="background-color: #000000;"></span>
        </span>
      </button>

      <div class="collapse navbar-collapse" id="navigation">
        <ul class="navbar-nav mx-auto">
          <li class="nav-item"></li>
          <li class="nav-item">
            <router-link class="nav-link me-2" to="/signup" style="color: #000000;">
              <i class="fas fa-user-circle opacity-6 me-1" style="color: #000000;" aria-hidden="true"></i>
              Sign Up
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link me-2" to="/signin" style="color: #000000;">
              <i class="fas fa-key opacity-6 me-1" style="color: #000000;" aria-hidden="true"></i>
              Sign In
            </router-link>
          </li>
        </ul>

        <!-- Optional button example
        <ul class="navbar-nav d-lg-block d-none">
          <li class="nav-item">
            <a
              href=""
              class="btn btn-sm mb-0 me-1"
              style="background-color: #e0e0e0; color: #000000;"
            >
              Download App
            </a>
          </li>
        </ul>
        -->

      </div>
    </div>
  </nav>
</template>
