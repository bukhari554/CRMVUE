<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import TradingAccountCard from "@/views/User/components/TradingAccountCard.vue";
import FundsCard from "@/views/User/components/FundsCard.vue";
import DocumentVerification from "@/views/User/components/DocumentVerification.vue";

const store = useStore();
const currentUser = computed(() => store.getters.currentUser || {});

const formattedTelephone = computed(() => {
  const u = currentUser.value;
  if (!u.telephone && !u.country_code) return "—";

  const code = u.country_code ? `(${u.country_code})` : "";
  const phone = u.telephone || "";
  return `${code} ${phone}`.trim();
});
</script>

<template>
  <div class="py-4 container-fluid">
    <!-- First Row: Profile Card + My Funds Card -->
    <div class="row mb-4">
      <!-- Profile Card - Left -->
      <div class="col-lg-6 col-md-6 mb-4 mb-lg-0">
        <div class="dashboard-card h-100">
          <div class="card-body p-4">
            <!-- User Icon -->
            <div class="text-center mb-3">
              <div class="user-avatar">
                <i class="ni ni-single-02"></i>
              </div>
            </div>

            <!-- User Name -->
            <h5 class="text-center mb-2 user-name">
              {{ currentUser.name || "—" }}
            </h5>

            <!-- Account Type -->
            <div class="text-center text-muted mb-4" style="font-size: 14px;">
              Account Type: <span class="fw-semibold">{{ currentUser.account_type || "—" }}</span>
            </div>

            <hr class="my-3" style="border-color: #e0e0e0;" />

            <!-- User Details -->
            <div class="user-info">
              <!-- Email -->
              <div class="info-row">
                <div class="info-label">
                  <i class="fas fa-envelope me-2"></i>EMAIL
                </div>
                <div class="info-value">{{ currentUser.email || "—" }}</div>
              </div>

              <!-- Telephone -->
              <div class="info-row">
                <div class="info-label">
                  <i class="ni ni-mobile-button me-2"></i> TELEPHONE
                </div>
                <div class="info-value">{{ formattedTelephone }}</div>
              </div>    

              <!-- Country -->
              <div class="info-row">
                <div class="info-label">
                  <i class="fas fa-globe me-2"></i>COUNTRY
                </div>
                <div class="info-value">{{ currentUser.country || "—" }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- My Funds Card - Right -->
      <div class="col-lg-6 col-md-12 mb-4 mb-lg-0">
        <FundsCard />
      </div>
    </div>

    <!-- Second Row: Trading Accounts Card + Document Verification Card -->
    <div class="row">
      <!-- Trading Accounts Card - Left -->
      <div class="col-lg-6 col-md-6 mb-4 mb-lg-0">
        <TradingAccountCard />
      </div>

      <!-- Document Verification Card - Right -->
      <div class="col-lg-6 col-md-6 mb-4 mb-lg-0">
        <DocumentVerification />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dashboard Card - Consistent for all cards */
.dashboard-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.card-body {
  flex: 1;
}

/* User Avatar */
.user-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.user-avatar i {
  font-size: 36px;
  color: white;
}

/* User Name */
.user-name {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

/* User Info Rows */
.user-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
}

.info-label i {
  color: #1a1a1a;
  font-size: 14px;
}

.info-value {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  word-break: break-word;
}

/* Ensure equal height for all cards in a row */
.row {
  display: flex;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 991px) {
  .user-avatar {
    width: 70px;
    height: 70px;
  }

  .user-avatar i {
    font-size: 32px;
  }

  .user-name {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .col-lg-6 {
    margin-bottom: 1.5rem !important;
  }

  .user-avatar {
    width: 60px;
    height: 60px;
  }

  .user-avatar i {
    font-size: 28px;
  }

  .user-name {
    font-size: 18px;
  }

  .info-label {
    font-size: 11px;
  }

  .info-value {
    font-size: 14px;
  }
}
</style>