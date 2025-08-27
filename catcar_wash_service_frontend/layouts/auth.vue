<template>
  <v-app>
    <v-container fluid class="pa-0" style="height: 100vh">
      <v-row no-gutters style="height: 100%">
        <!-- Left Side - Image with Gradient -->
        <v-col cols="12" md="6" class="d-none d-md-flex">
          <div class="image-section">
            <div class="gradient-overlay">
              <div class="content-overlay">
                <div class="brand-section">
                  <img
                    class="brand-logo"
                    src="/Logo/CCW LOGO-02-white-text.png"
                    alt="CAT CARWASH Logo"
                  >
                </div>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Right Side - Form Content -->
        <v-col cols="12" md="6" class="d-flex align-center justify-center">
          <div class="form-container">
            <slot />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<style scoped>
.image-section {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: url('/shop-cat-100-2.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 152, 0, 0.9) 0%,
    rgba(255, 193, 7, 0.8) 50%,
    rgba(255, 87, 34, 0.9) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-overlay {
  text-align: center;
  padding: 2rem 1.5rem;
  max-width: 500px;
}

.brand-section {
  animation: fadeInUp 1s ease-out;
}

.brand-logo {
  width: 70%;
  max-width: 420px;
  height: auto;
  display: block;
  margin: 0 auto;
}

.form-container {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem 2rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .form-container {
    padding: 1.25rem;
  }
}
</style>