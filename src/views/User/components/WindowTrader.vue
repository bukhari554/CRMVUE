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
            <i class="fab fa-windows"></i>
          </div>
          <div>
            <h1 class="page-title">MT5 TRADER (Windows)</h1>
            <p class="page-subtitle">Professional desktop trading platform for Windows PC</p>
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
              src="@/assets/img/mt5-windows.png" 
              alt="MT5 Windows Platform" 
              class="desktop-image"
            />
          </div>
        </div>

        <!-- Right Side - Info Cards -->
        <div class="info-section">
          <!-- Description Card -->
          <div class="info-card description-card">
            <p class="description-text">
              Download the most popular trading platform for your every trading need. With a wide range of indicators and fully customisable platform, access your MT5 trading account from anywhere in the world from your PC.
            </p>
          </div>

          <!-- Features Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-star"></i>
              <h3 class="card-title">Features11111</h3>
            </div>
            <ul class="feature-list">
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Trade FX, CFDs, stock metals, commodities and indices</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Automated trading through Expert Advisors</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Impressive analytical tools</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Streaming news</span>
              </li>
              <li>
                <i class="fas fa-check-circle"></i>
                <span>Activity reports</span>
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
                <span>Click to download the terminal</span>
              </li>
              <li>
                <span class="step-number">2</span>
                <span>Once download is complete, please run the .exe file</span>
              </li>
              <li>
                <span class="step-number">3</span>
                <span>Fill in your login details on the first launch of the MT5</span>
              </li>
              <li>
                <span class="step-number">4</span>
                <span>Enter your Live or Demo account login credentials (username and password are stated in your Najm Capital welcome email)</span>
              </li>
            </ul>
          </div>

          <!-- Download Card -->
          <div class="info-card download-card">
            <div class="download-section">
              <div class="download-info">
                <i class="fab fa-windows fa-3x"></i>
                <div>
                  <h4 class="download-title">Ready to Start Trading?</h4>
                  <p class="download-desc">Download MT5 for Windows and access powerful trading tools</p>
                </div>
              </div>
              <a 
                href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe" 
                class="download-button"
                download
              >
                <i class="fas fa-download me-2"></i>
                Download MT5
              </a>
            </div>
          </div>

          <!-- Contact Card -->
          <div class="info-card contact-card">
            <p class="contact-text">
              If you have any questions, please contact us at 
              <a href="mailto:noreply@najmcapital.com" class="contact-link">noreply@najmcapital.com</a>
            </p>
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
  font-size: 28px;
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
  grid-template-columns: 450px 1fr;
  gap: 32px;
}

/* Image Card */
.image-card {
  background: #f1f1f1;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.desktop-image {
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
  background: #ffff;
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
  background: #111111;
  border: 2px solid #111111;
}

.description-text {
  font-size: 15px;
  line-height: 26px;
  color: white;
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

.download-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.download-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.download-info i {
  color: #111111;
}

.download-title {
  font-size: 18px;
  font-weight: 700;
  color: #111111;
  margin: 0 0 4px 0;
}

.download-desc {
  font-size: 14px;
  color: #666666;
  margin: 0;
}

/* Download Button */
.download-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #111111;
  color: #ffffff;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
}

.download-button:hover {
  background: #333333;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  color: #ffffff;
  text-decoration: none;
}

.download-button i {
  margin-right: 8px;
}

.me-2 {
  margin-right: 8px;
}

/* Contact Card */
.contact-card {
  background: #f1f1f1;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.contact-text {
  font-size: 14px;
  color: #444444;
  margin: 0;
  line-height: 22px;
}

.contact-link {
  color: #111111;
  font-weight: 600;
  text-decoration: underline;
  transition: all 0.2s ease;
}

.contact-link:hover {
  color: #333333;
  text-decoration: none;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 400px 1fr;
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

  .desktop-image {
    max-width: 500px;
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
    font-size: 24px;
  }

  .desktop-image {
    max-width: 100%;
  }

  .download-button {
    padding: 12px 24px;
    font-size: 14px;
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

  .download-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>