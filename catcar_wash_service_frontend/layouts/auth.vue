<template>
  <v-app class="modern-auth-app">
    <!-- Mobile Header with Logo -->
    <v-app-bar
      v-if="$vuetify.display.mdAndDown"
      class="mobile-header"
      elevation="0"
      height="72"
      color="transparent"
    >
      <v-spacer />
      <div class="d-flex align-center ga-3">
        <img
          src="/Logo/Asset 33@2x.png"
          alt="CAT CARWASH Logo"
          class="mobile-logo-icon"
        >
        <img
          src="/Logo/Asset gray text.png"
          alt="CAT CARWASH Text"
          class="mobile-logo-text"
        >
      </div>
      <v-spacer />
    </v-app-bar>

    <!-- Main Content Container -->
    <v-main class="auth-main">
      <v-container fluid class="auth-container">
        <v-row no-gutters class="auth-row">
          <!-- Left Side - Brand Showcase -->
          <v-col cols="12" lg="7" xl="8" class="brand-section d-none d-lg-flex">
            <div class="brand-showcase">
              <!-- Animated Background -->
              <div class="animated-bg">
                <div class="bg-circle circle-1" />
                <div class="bg-circle circle-2" />
                <div class="bg-circle circle-3" />
              </div>

              <!-- Content -->
              <div class="brand-content">
                <div class="brand-header">
                  <img
                    src="/Logo/CCW LOGO-02-white-text.png"
                    alt="CAT CARWASH Logo"
                    class="brand-logo"
                  >
                </div>

                <div class="brand-info">
                  <h1 class="brand-title">
                    ระบบจัดการอัตโนมัติ
                  </h1>
                  <p class="brand-description">
                    เทคโนโลยีล้างรถแมวที่ทันสมัย ด้วยระบบควบคุมที่ฉลาดและใช้งานง่าย 
                    เพื่อประสบการณ์ที่ดีที่สุดสำหรับลูกค้าของคุณ
                  </p>
                  
                  <div class="feature-points">
                    <div class="feature-point">
                      <v-icon icon="mdi-check-circle" color="white" size="20" />
                      <span>ระบบควบคุมอุปกรณ์อัตโนมัติ</span>
                    </div>
                    <div class="feature-point">
                      <v-icon icon="mdi-check-circle" color="white" size="20" />
                      <span>รายงานยอดขายแบบเรียลไทม์</span>
                    </div>
                    <div class="feature-point">
                      <v-icon icon="mdi-check-circle" color="white" size="20" />
                      <span>จัดการลูกค้าและพนักงาน</span>
                    </div>
                  </div>
                </div>

                <!-- Cat Character -->
                <div class="cat-character">
                  <img
                    src="/Character/character cat-02.png"
                    alt="Cat Character"
                    class="cat-image"
                  >
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right Side - Form Area -->
          <v-col cols="12" lg="5" xl="4" class="form-section">
            <div class="d-flex flex-column justify-center fill-height pa-4">
              <slot />
              
              <!-- Footer Info -->
              <div class="text-center mt-4 pa-2">
                <div class="text-caption text-medium-emphasis">
                  &copy; 2024 Cat Car Wash Service. สงวนลิขสิทธิ์.
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Modern Auth App */
.modern-auth-app {
  background: linear-gradient(135deg, 
    #f8fafc 0%, 
    #f1f5f9 50%, 
    #e2e8f0 100%);
  min-height: 100vh;
}

/* Mobile Header */
.mobile-header {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
}

/* Removed unused .mobile-brand class */

.mobile-logo-icon {
  height: 40px;
  width: auto;
}

.mobile-logo-text {
  height: 32px;
  width: auto;
}

/* Auth Main */
.auth-main {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
}

.auth-container {
  height: 100vh;
  padding: 0 !important;
}

.auth-row {
  height: 100%;
  min-height: 100vh;
}

/* Brand Section */
.brand-section {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, 
    #f57f2a 0%, 
    #ff9800 25%,
    #f57c00 75%, 
    #ef6c00 100%);
}

.brand-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/CCW-Operation Manual (2).png');
  background-size: 100%;
  background-position: bottom left;
  background-repeat: no-repeat;
  opacity: 0.20;
  z-index: 1;
}

.brand-showcase {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
}

/* Animated Background */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 2;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(2px);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: -10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: -5%;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-20px) rotate(5deg); }
  66% { transform: translateY(10px) rotate(-3deg); }
}

/* Brand Content */
.brand-content {
  position: relative;
  z-index: 3;
  text-align: center;
  max-width: 600px;
  color: white;
  animation: slideInLeft 1s ease-out;
}

.brand-header {
  margin-bottom: 3rem;
}

.brand-logo {
  width: 40%;
  max-width: 400px;
  height: auto;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.4)) 
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
          drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.brand-info {
  margin-bottom: 2rem;
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.brand-description {
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.95;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.feature-points {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  max-width: 400px;
  margin: 0 auto;
  opacity: 1;
}

.feature-point {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  opacity: 1;
  color: white;
}

/* Cat Character */
.cat-character {
  position: absolute;
  bottom: -2rem;
  right: 2rem;
  animation: bounce 3s ease-in-out infinite;
  opacity: 1;
}

.cat-image {
  width: 120px;
  height: auto;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3));
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* Form Section */
.form-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(var(--v-theme-outline), 0.1);
  position: relative;
}

/* Animations for form area */
.form-section .d-flex {
  animation: slideInRight 0.8s ease-out;
}

/* Animations */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-60px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(60px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Dark Theme Support */
.v-theme--dark .modern-auth-app {
  background: linear-gradient(135deg, 
    #0f172a 0%, 
    #1e293b 50%, 
    #334155 100%);
}

.v-theme--dark .mobile-header {
  background: rgba(var(--v-theme-surface), 0.95) !important;
}

.v-theme--dark .form-section {
  background: rgba(var(--v-theme-surface), 0.95);
  border-left-color: rgba(var(--v-theme-outline), 0.2);
}

.v-theme--dark .mobile-logo-text {
  filter: brightness(0) invert(1);
}

/* Responsive Design - Using CSS custom properties with Vuetify breakpoints */
.brand-title {
  font-size: clamp(2rem, 4vw, 2.5rem);
}

.brand-description {
  font-size: clamp(1rem, 2vw, 1.125rem);
}

.cat-character {
  bottom: clamp(1rem, 3vh, 2rem);
  right: clamp(1rem, 3vw, 2rem);
}

.cat-image {
  width: clamp(80px, 15vw, 120px);
}

.mobile-logo-icon {
  height: clamp(28px, 6vw, 40px);
}

.mobile-logo-text {
  height: clamp(24px, 5vw, 32px);
}

/* Performance Optimizations - Removed unnecessary will-change properties */

/* Smooth Transitions */
.form-section,
.brand-section {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>