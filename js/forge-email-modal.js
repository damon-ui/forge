// forge-email-modal.js
// Email to Client modal for FORGE tools (TRN-21)
// Sends branded emails via Resend API through Cloudflare Worker

const ForgeEmailModal = (function() {
  'use strict';

  // ===== CONFIGURATION =====
  const EMAIL_WORKER_URL = 'https://trnt-email-proxy.damon-be2.workers.dev';

  // ===== STATE =====
  let modalElement = null;
  let currentOptions = {};

  // ===== PUBLIC API =====

  function init(options = {}) {
    const modalId = options.modalId || 'emailModal';
    const containerSelector = options.container || 'body';

    // Check if modal already exists
    modalElement = document.getElementById(modalId);

    // If not found, inject it
    if (!modalElement) {
      const container = document.querySelector(containerSelector);
      if (container) {
        container.insertAdjacentHTML('beforeend', getModalHTML({ modalId }));
        modalElement = document.getElementById(modalId);
      }
    }

    if (!modalElement) {
      console.warn('ForgeEmailModal: Modal element not found and could not be injected');
    }
  }

  function open(options = {}) {
    if (!modalElement) {
      console.warn('ForgeEmailModal: Not initialized. Call init() first.');
      return;
    }

    currentOptions = {
      clientName: options.clientName || '',
      toolType: options.toolType || 'itinerary',
      itemUrl: options.itemUrl || '',
      onSuccess: options.onSuccess || null
    };

    // Pre-fill form fields
    const clientNameInput = modalElement.querySelector('[data-email-client-name]');
    const emailInput = modalElement.querySelector('[data-email-address]');
    const subjectInput = modalElement.querySelector('[data-email-subject]');
    const messageInput = modalElement.querySelector('[data-email-message]');
    const footerText = modalElement.querySelector('[data-email-footer]');

    if (clientNameInput) clientNameInput.value = currentOptions.clientName;
    if (emailInput) emailInput.value = '';
    if (messageInput) messageInput.value = '';

    // Set default subject based on toolType
    const defaultSubjects = {
      itinerary: 'Your Trip Itinerary from TRNT Travel',
      comparison: 'Your Trip Options from TRNT Travel'
    };
    if (subjectInput) {
      subjectInput.value = defaultSubjects[currentOptions.toolType] || defaultSubjects.itinerary;
    }

    // Update footer text based on toolType
    const footerLabels = {
      itinerary: 'itinerary',
      comparison: 'options'
    };
    if (footerText) {
      footerText.textContent = `Email includes link to view ${footerLabels[currentOptions.toolType] || 'content'}. Sent from damon@trnttravel.com`;
    }

    // Reset send button state
    setSendingState(false);

    // Show modal
    modalElement.classList.add('active');

    // Position modal if ForgeEmbed is available
    if (typeof ForgeEmbed !== 'undefined' && ForgeEmbed.positionModal) {
      const triggerElement = options.triggerElement || document.activeElement;
      ForgeEmbed.positionModal(modalElement, { anchorTo: triggerElement });
    }

    // Focus email input
    if (emailInput) emailInput.focus();
  }

  function close() {
    if (!modalElement) return;

    // Reset modal position if ForgeEmbed is available
    if (typeof ForgeEmbed !== 'undefined' && ForgeEmbed.resetModalPosition) {
      ForgeEmbed.resetModalPosition(modalElement);
    }

    modalElement.classList.remove('active');
    currentOptions = {};
  }

  async function send() {
    if (!modalElement) return;

    const clientNameInput = modalElement.querySelector('[data-email-client-name]');
    const emailInput = modalElement.querySelector('[data-email-address]');
    const subjectInput = modalElement.querySelector('[data-email-subject]');
    const messageInput = modalElement.querySelector('[data-email-message]');

    const clientName = clientNameInput?.value?.trim() || '';
    const email = emailInput?.value?.trim() || '';
    const subject = subjectInput?.value?.trim() || '';
    const personalMessage = messageInput?.value?.trim() || '';

    // Validation
    if (!email) {
      ForgeUtils.UI.showToast('Please enter an email address', 'error');
      emailInput?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      ForgeUtils.UI.showToast('Please enter a valid email address', 'error');
      emailInput?.focus();
      return;
    }

    if (!subject) {
      ForgeUtils.UI.showToast('Please enter a subject', 'error');
      subjectInput?.focus();
      return;
    }

    // Set loading state
    setSendingState(true);

    try {
      const payload = {
        to: email,
        subject: subject,
        clientName: clientName,
        toolType: currentOptions.toolType,
        compareUrl: currentOptions.itemUrl,
        personalMessage: personalMessage || undefined
      };

      const response = await fetch(EMAIL_WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send email (${response.status})`);
      }

      ForgeUtils.UI.showToast('Email sent successfully!', 'success');

      if (currentOptions.onSuccess) {
        currentOptions.onSuccess({ email, clientName, subject });
      }

      close();

    } catch (error) {
      console.error('ForgeEmailModal send error:', error);
      ForgeUtils.UI.showToast(error.message || 'Failed to send email', 'error');
      setSendingState(false);
    }
  }

  // ===== HELPERS =====

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function setSendingState(sending) {
    const sendBtn = modalElement?.querySelector('[data-email-send-btn]');
    const sendBtnText = modalElement?.querySelector('[data-email-send-text]');
    const sendBtnSpinner = modalElement?.querySelector('[data-email-send-spinner]');

    if (sendBtn) sendBtn.disabled = sending;
    if (sendBtnText) sendBtnText.textContent = sending ? 'Sending...' : 'Send Email';
    if (sendBtnSpinner) sendBtnSpinner.classList.toggle('hidden', !sending);
  }

  // ===== HTML TEMPLATE =====

  function getModalHTML(options = {}) {
    const modalId = options.modalId || 'emailModal';

    return `
  <div id="${modalId}" class="modal-backdrop">
    <div class="modal-content" style="max-width: 480px;">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold" style="color: var(--trnt-accent);">Email to Client</h3>
        <button onclick="ForgeEmailModal.close()" class="p-1 hover:bg-gray-100 rounded">
          <svg class="w-5 h-5" style="color: var(--trnt-border);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="form-label">Client Name</label>
          <input type="text" data-email-client-name class="form-input" placeholder="Client name">
        </div>
        <div>
          <label class="form-label">Email Address <span style="color: #C4756E;">*</span></label>
          <input type="email" data-email-address class="form-input" placeholder="client@example.com" required>
        </div>
        <div>
          <label class="form-label">Subject</label>
          <input type="text" data-email-subject class="form-input" placeholder="Email subject">
        </div>
        <div>
          <label class="form-label">Personal Message</label>
          <textarea data-email-message class="form-input" rows="3" placeholder="Add a personal note (optional)" style="resize: vertical;"></textarea>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick="ForgeEmailModal.send()" data-email-send-btn class="flex-1 py-2 text-white font-medium rounded-lg flex items-center justify-center gap-2" style="background: var(--btn-special);">
            <svg data-email-send-spinner class="hidden animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span data-email-send-text>Send Email</span>
          </button>
          <button onclick="ForgeEmailModal.close()" class="px-4 py-2 font-medium rounded-lg" style="background: white; color: var(--trnt-accent); border: 2px solid var(--trnt-border);">Cancel</button>
        </div>
        <p data-email-footer class="text-xs text-center" style="color: var(--trnt-secondary);">
          Email includes link to view itinerary. Sent from damon@trnttravel.com
        </p>
      </div>
    </div>
  </div>
    `;
  }

  return {
    init,
    open,
    close,
    send,
    getModalHTML
  };

})();

window.ForgeEmailModal = ForgeEmailModal;
