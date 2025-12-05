// forge-detail-modal.js
// Reusable detail modal component for FORGE tools
// Displays: title, optional photo, features list

const ForgeDetailModal = (function() {
  'use strict';

  // ===== STATE =====
  let modalElement = null;

  // ===== PUBLIC API =====

  function init(options = {}) {
    modalElement = document.getElementById(options.modalId || 'detailModal');
    if (!modalElement) {
      console.warn('ForgeDetailModal: Modal element not found');
    }
  }

  function open(options = {}) {
    if (!modalElement) return;

    const title = options.title || 'Details';
    const photo = options.photo || '';
    const content = options.content || '';
    const features = options.features || [];

    // Set modal title
    const titleEl = modalElement.querySelector('#detailModalTitle');
    if (titleEl) titleEl.textContent = title;

    // Build content HTML
    let contentHTML = '';

    // Photo (if exists)
    if (photo) {
      contentHTML += `
        <div class="rounded-lg overflow-hidden mb-4">
          <img src="${photo}" alt="${title}" class="w-full h-48 object-cover" onerror="this.style.display='none'">
        </div>
      `;
    }

    // Custom HTML content (if provided)
    if (content) {
      contentHTML += `<div class="mb-4">${content}</div>`;
    }

    // Features list
    if (features.length > 0) {
      contentHTML += `
        <h4 class="font-semibold mb-2" style="color: var(--trnt-accent);">Features</h4>
        <ul class="space-y-2">
          ${features.map(feat => `
            <li class="flex items-start gap-2 text-sm text-gray-700">
              <span class="text-blue-600 mt-0.5">\u2022</span>
              <span>${feat}</span>
            </li>
          `).join('')}
        </ul>
      `;
    } else if (!content && !photo) {
      contentHTML += `<p class="text-gray-500 italic text-sm">No details available.</p>`;
    }

    // Inject content
    const contentEl = modalElement.querySelector('#detailModalContent');
    if (contentEl) contentEl.innerHTML = contentHTML;

    // Show modal
    modalElement.classList.add('active');
  }

  function close() {
    if (!modalElement) return;
    modalElement.classList.remove('active');
  }

  return {
    init,
    open,
    close
  };

})();

window.ForgeDetailModal = ForgeDetailModal;
