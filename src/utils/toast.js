export const showToast = (message, type = 'info') => {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.custom-toast');
  existingToasts.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;

  const iconClass =
    type === 'success'
      ? 'fa-check-circle'
      : type === 'error'
      ? 'fa-exclamation-circle'
      : 'fa-info-circle';

  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
