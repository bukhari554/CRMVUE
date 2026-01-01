<script setup>
import { ref } from 'vue'
import BalanceComponent from '@/views/User/components/Balance.vue'
import InternalTransferComponent from '@/views/User/components/InternalTransfer.vue'
import DepositComponent from '@/views/User/components/Deposit.vue'

const showInternalTransfer = ref(false)
const showDeposit = ref(false)

const openInternalTransfer = () => {
  showInternalTransfer.value = true
}

const openDeposit = () => {
  showDeposit.value = true
}

const closeInternalTransfer = () => {
  showInternalTransfer.value = false
}

const closeDeposit = () => {
  showDeposit.value = false
}

// Close modal on background click
const handleBackgroundClick = (closeFunction) => {
  closeFunction()
}

// Prevent closing when clicking inside modal
const handleModalClick = (event) => {
  event.stopPropagation()
}
</script>

<template>
  <div class="dashboard-card">
    <!-- Card Header -->
    <div class="card-header">
      <h3 class="card-title">My funds</h3>
      <button class="menu-button">
        <i class="fas fa-ellipsis-h"></i>
      </button>
    </div>

    <!-- Balance Component Row -->
    <div class="balance-row">
      <BalanceComponent />
    </div>

    <!-- Buttons Row -->
    <div class="buttons-row">
      <div class="action-item" @click="openDeposit">
        <div class="action-icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <span class="action-text">Add Funds</span>
      </div>

      <div class="action-item" @click="openInternalTransfer">
        <div class="action-icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/>
          </svg>
        </div>
        <span class="action-text">Internal Transfers</span>
      </div>
    </div>

    <!-- Internal Transfer Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showInternalTransfer" 
          class="modal-overlay"
          @click="handleBackgroundClick(closeInternalTransfer)"
        >
          <div class="modal-container" @click="handleModalClick">
            <button class="modal-close" @click="closeInternalTransfer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <InternalTransferComponent />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Deposit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showDeposit" 
          class="modal-overlay"
          @click="handleBackgroundClick(closeDeposit)"
        >
          <div class="modal-container" @click="handleModalClick">
            <button class="modal-close" @click="closeDeposit">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <DepositComponent />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dashboard-card {
  background-color: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Card Header with Menu Button */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  flex-shrink: 0;
}

.card-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.menu-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666666;
}

.menu-button:hover {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
}

.menu-button i {
  font-size: 16px;
}

/* Balance Row */
.balance-row {
  margin-top: 30px;
  margin-bottom: 60px;
  flex-shrink: 0;
}

/* Buttons Row */
.buttons-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  flex-shrink: 0;
  margin-top: auto;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.action-item:hover {
  transform: translateY(-4px);
}

.action-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-icon-circle:hover {
  background-color: #333333;
}

.action-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  text-align: center;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  padding: 32px;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close:hover {
  background-color: #e5e5e5;
  transform: rotate(90deg);
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #333;
}

/* Modal Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.8) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-card {
    padding: 24px;
  }

  .card-header {
    margin-bottom: 32px;
  }

  .card-title {
    font-size: 24px;
  }

  .balance-row {
    margin-bottom: 40px;
  }

  .buttons-row {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .modal-container {
    max-width: 100%;
    padding: 24px;
  }
}

/* Scrollbar Styling for Modal */
.modal-container::-webkit-scrollbar {
  width: 8px;
}

.modal-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.modal-container::-webkit-scrollbar-thumb {
  background: #000000;
  border-radius: 10px;
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: #333333;
}
</style>