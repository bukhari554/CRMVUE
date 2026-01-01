<script setup>
// Static page - no JS needed
</script>

<template>
  <div class="page-wrapper">
    <!-- Header Card -->
    <div class="header-card">
      <div class="header-content">
        <div class="header-left">
          <div class="icon-wrapper">
            <i class="fas fa-mobile-alt"></i>
          </div>
          <div>
            <h1 class="page-title">Mobile Trader (Android)</h1>
            <p class="page-subtitle">Access our trading platform from anywhere</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="content-card">
      <div class="content-grid">
        <!-- Left Side - Image Card -->
        <div class="image-card">
          <div class="image-wrapper">
            <img 
              src="@/assets/img/mobile-app.png" 
              alt="Mobile Trading App" 
              class="mobile-image"
            />
          </div>
        </div>

        <!-- Right Side - Info Cards -->
        <div class="info-section">
          <!-- Description Card -->
          <div class="info-card description-card">
            <p class="description-text">
              Discover the MT5 mobile trader, and access our fully customisable trading platform from your mobile device. A convenient and practical trading option for traders on the move.
            </p>
          </div>

          <!-- Features Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-star"></i>
              <h3 class="card-title">Features</h3>
            </div>
            <ul class="feature-list">
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Trade from anywhere in the world directly from your mobile device</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Compatible with Android</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Fully functional Forex and CFDs trading</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Streaming news</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Impressive analytical tools</span>
              </li>
            </ul>
          </div>

          <!-- Installation Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-download"></i>
              <h3 class="card-title">How to Install</h3>
            </div>
            <ul class="install-list">
              <li>
                <span class="step-number">1</span>
                <span>Click the button below to download MT5</span>
              </li>
              <li>
                <span class="step-number">2</span>
                <span>Fill in your login details on the first launch of the MT5</span>
              </li>
              <li>
                <span class="step-number">3</span>
                <span>Enter your Live or Demo account login credentials (username and password are stated in your Najm Capital welcome email)</span>
              </li>
            </ul>
          </div>

          <!-- OS & Download Card -->
          <div class="info-card download-card">
            <div class="os-section">
              <div class="os-info">
                <i class="fab fa-android fa-2x"></i>
                <div>
                  <h4 class="os-title">Supported OS</h4>
                  <p class="os-name">Android</p>
                </div>
              </div>
              <a href="https://play.google.com/store" target="_blank" class="download-btn">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play"
                  class="playstore-badge"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Wrapper */
.page-wrapper {
  padding: 24px;
  background: #f1f1f1;
  min-height: 100vh;
}

/* Header Card */
.header-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px 32px;
  margin-bottom: 24px;
  border: 1px solid #e5e5e5;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: #111111;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111111;
  margin: 0;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #666666;
  margin: 0;
}

/* Main Content Card */
.content-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px;
  border: 1px solid #e5e5e5;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
}

/* Image Card */
.image-card {
  background: #f1f1f1;
  border-radius: 16px;
  padding: 24px;
}

.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 90px;
}

.mobile-image {
  max-width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

/* Info Section */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Info Cards */
.info-card {
  background: #f1f1f1;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #111111;
}

.description-card {
  background: #ffffff;
  border: 2px solid #111111;
}

.description-text {
  font-size: 15px;
  line-height: 26px;
  color: #333333;
  margin: 0;
  font-weight: 500;
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.card-header i {
  font-size: 20px;
  color: #111111;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

/* Feature List */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: #444444;
  line-height: 22px;
}

.feature-list i {
  color: #111111;
  font-size: 16px;
  margin-top: 3px;
  flex-shrink: 0;
}

/* Install List */
.install-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.install-list li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  font-size: 14px;
  color: #444444;
  line-height: 22px;
}

.step-number {
  width: 28px;
  height: 28px;
  background: #111111;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

/* Download Card */
.download-card {
  background: #ffffff;
  border: 2px solid #111111;
}

.os-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.os-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.os-info i {
  color: #111111;
}

.os-title {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  margin: 0 0 4px 0;
}

.os-name {
  font-size: 18px;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

/* Download Button */
.download-btn {
  display: inline-block;
  transition: transform 0.3s ease;
}

.playstore-badge {
  height: 56px;
  width: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.download-btn:hover {
  transform: scale(1.05);
}

.download-btn:hover .playstore-badge {
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15));
}

/* Responsive Design */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 350px 1fr;
    gap: 24px;
  }
}

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .image-card {
    padding: 32px;
  }

  .mobile-image {
    max-width: 350px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px;
  }

  .header-card {
    padding: 20px;
  }

  .content-card {
    padding: 20px;
  }

  .page-title {
    font-size: 20px;
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .mobile-image {
    max-width: 100%;
  }

  .os-section {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 13px;
  }
}
</style>