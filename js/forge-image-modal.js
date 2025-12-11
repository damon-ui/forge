// forge-image-modal.js
// Shared image modal functionality for FORGE tools
// Handles: Unsplash search, file upload, URL input

const ForgeImageModal = (function() {
  'use strict';

  // ===== CONFIGURATION =====
  const UNSPLASH_WORKER_URL = 'https://trnt-unsplash.damon-be2.workers.dev';
  const MAX_UPLOAD_SIZE = 2 * 1024 * 1024; // 2MB for JSONBin

  // ===== STATE =====
  let currentCallback = null;
  let modalElement = null;

  // ===== PUBLIC API =====

  function init(options = {}) {
    const modalId = options.modalId || 'imageModal';
    const containerSelector = options.container || 'body';
    
    // Check if modal already exists
    modalElement = document.getElementById(modalId);
    
    // If not found, try to inject it
    if (!modalElement) {
      const container = document.querySelector(containerSelector);
      if (container) {
        container.insertAdjacentHTML('beforeend', getModalHTML({ modalId }));
        modalElement = document.getElementById(modalId);
      }
    }
    
    if (!modalElement) {
      console.warn('ForgeImageModal: Modal element not found and could not be injected');
    }
  }

  function open(options = {}) {
    if (!modalElement) return;

    currentCallback = options.onSave || null;

    const urlInput = modalElement.querySelector('[data-image-url]');
    if (urlInput) urlInput.value = options.currentUrl || '';

    const titleEl = modalElement.querySelector('[data-modal-title]');
    if (titleEl && options.title) titleEl.textContent = options.title;

    resetUploadStatus();
    resetUnsplashSearch();

    modalElement.classList.add('active');

    // TRN-217: Use centralized modal positioning
    const triggerElement = options.triggerElement || document.activeElement;
    ForgeEmbed.positionModal(modalElement, { anchorTo: triggerElement });
  }

  function close() {
    if (!modalElement) return;

    // TRN-217: Use centralized reset
    ForgeEmbed.resetModalPosition(modalElement);

    modalElement.classList.remove('active');
    currentCallback = null;
  }

  function save() {
    const urlInput = modalElement?.querySelector('[data-image-url]');
    const url = urlInput?.value?.trim() || ''; // TRN-210: Allow empty URL to clear photo

    if (currentCallback) {
      currentCallback(url);
    }

    close();
  }

  // ===== FILE UPLOAD =====

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE) {
      ForgeUtils.UI.showToast('Image too large. Please use under 2MB or paste a URL.', 'error');
      return;
    }

    const statusEl = modalElement?.querySelector('[data-upload-status]');
    if (statusEl) {
      statusEl.textContent = 'Processing...';
      statusEl.className = 'text-xs mt-1 text-center text-gray-500';
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const urlInput = modalElement?.querySelector('[data-image-url]');
      if (urlInput) urlInput.value = e.target.result;
      if (statusEl) {
        statusEl.textContent = 'Image ready! Click Save to apply.';
        statusEl.className = 'text-xs mt-1 text-center text-green-600';
      }
    };
    reader.onerror = () => {
      if (statusEl) {
        statusEl.textContent = 'Error reading file. Try pasting a URL.';
        statusEl.className = 'text-xs mt-1 text-center text-red-500';
      }
    };
    reader.readAsDataURL(file);
  }

  function resetUploadStatus() {
    const statusEl = modalElement?.querySelector('[data-upload-status]');
    const fileInput = modalElement?.querySelector('[data-file-input]');
    if (statusEl) statusEl.textContent = '';
    if (fileInput) fileInput.value = '';
  }

  // ===== UNSPLASH SEARCH =====

  function toggleUnsplashSearch() {
    const panel = modalElement?.querySelector('[data-unsplash-panel]');
    if (!panel) return;

    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      const input = panel.querySelector('[data-unsplash-query]');
      if (input) input.focus();
    }
  }

  async function searchUnsplash() {
    const queryInput = modalElement?.querySelector('[data-unsplash-query]');
    const resultsDiv = modalElement?.querySelector('[data-unsplash-results]');
    const searchBtn = modalElement?.querySelector('[data-unsplash-search-btn]');

    const query = queryInput?.value?.trim();
    if (!query) {
      ForgeUtils.UI.showToast('Enter a search term', 'error');
      return;
    }

    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.textContent = '...';
    }
    if (resultsDiv) {
      resultsDiv.innerHTML = '<div class="unsplash-loading"><div class="spinner"></div>Searching...</div>';
    }

    try {
      const response = await fetch(
        `${UNSPLASH_WORKER_URL}/search?query=${encodeURIComponent(query)}&per_page=12`
      );
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        resultsDiv.innerHTML = '<p class="text-center text-gray-500 text-sm py-4">No images found.</p>';
        return;
      }

      resultsDiv.innerHTML = `<div class="unsplash-grid">${data.results.map(photo => `
        <img src="${photo.urls.small}"
             alt="${photo.description || query}"
             title="Photo by ${photo.photographer.name}"
             data-url="${photo.urls.regular}"
             data-download="${photo.downloadLink}"
             onclick="ForgeImageModal.selectUnsplashImage(this)" />
      `).join('')}</div>`;

    } catch (error) {
      console.error('Unsplash search error:', error);
      if (resultsDiv) {
        resultsDiv.innerHTML = '<p class="text-center text-red-500 text-sm py-4">Search failed.</p>';
      }
    } finally {
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
      }
    }
  }

  function selectUnsplashImage(imgElement) {
    const imageUrl = imgElement.dataset.url;
    const downloadLink = imgElement.dataset.download;

    const urlInput = modalElement?.querySelector('[data-image-url]');
    if (urlInput) urlInput.value = imageUrl;

    // Trigger download for attribution (fire and forget)
    try {
      fetch(`${UNSPLASH_WORKER_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: downloadLink })
      });
    } catch (e) { /* ignore */ }

    ForgeUtils.UI.showToast('Image selected! Click Save to apply.');

    const panel = modalElement?.querySelector('[data-unsplash-panel]');
    if (panel) panel.classList.add('hidden');
  }

  function resetUnsplashSearch() {
    const panel = modalElement?.querySelector('[data-unsplash-panel]');
    const queryInput = modalElement?.querySelector('[data-unsplash-query]');
    const resultsDiv = modalElement?.querySelector('[data-unsplash-results]');

    if (panel) panel.classList.add('hidden');
    if (queryInput) queryInput.value = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
  }

  // ===== HTML TEMPLATE =====

  function getModalHTML(options = {}) {
    const modalId = options.modalId || 'imageModal';
    const title = options.title || 'Change Image';

    return `
  <div id="${modalId}" class="modal-backdrop">
    <div class="modal-content">
      <div class="flex items-center justify-between mb-4">
        <h3 data-modal-title class="text-lg font-semibold" style="color: var(--trnt-accent);">${title}</h3>
        <button onclick="ForgeImageModal.close()" class="p-1 hover:bg-gray-100 rounded"><i data-lucide="x" class="w-5 h-5" style="color: var(--trnt-border);"></i></button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="form-label">Paste Image URL</label>
          <input type="url" data-image-url class="form-input" placeholder="https://...">
        </div>
        <div class="text-center text-gray-500 text-sm">&mdash; or &mdash;</div>
        <div>
          <label class="w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer" style="border-color: var(--trnt-border); color: var(--trnt-secondary);">
            <i data-lucide="upload" class="w-5 h-5"></i>
            <span>Upload from Device</span>
            <input type="file" data-file-input accept="image/*" class="hidden" onchange="ForgeImageModal.handleFileUpload(event)" />
          </label>
          <p data-upload-status class="text-xs mt-1 text-center" style="color: var(--trnt-secondary);"></p>
        </div>
        <div class="text-center text-gray-500 text-sm">&mdash; or &mdash;</div>
        <div class="unsplash-search-container">
          <button onclick="ForgeImageModal.toggleUnsplashSearch()" class="w-full py-2 border-2 border-dashed rounded-lg text-sm font-medium flex items-center justify-center gap-2" style="border-color: var(--trnt-border); color: var(--trnt-secondary);">
            <i data-lucide="image" class="w-4 h-4"></i> Search Unsplash
          </button>
          <div data-unsplash-panel class="hidden mt-3">
            <div class="unsplash-search-input">
              <input type="text" data-unsplash-query class="form-input" placeholder="e.g. santorini sunset" onkeydown="if(event.key==='Enter')ForgeImageModal.searchUnsplash()" />
              <button data-unsplash-search-btn onclick="ForgeImageModal.searchUnsplash()">Search</button>
            </div>
            <div data-unsplash-results></div>
            <div class="unsplash-credit">Photos by <a href="https://unsplash.com" target="_blank">Unsplash</a></div>
          </div>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick="ForgeImageModal.save()" class="flex-1 py-2 text-white font-medium rounded-lg" style="background: var(--btn-primary);">Save</button>
          <button onclick="ForgeImageModal.close()" class="px-4 py-2 font-medium rounded-lg" style="background: white; color: var(--trnt-accent); border: 2px solid var(--trnt-border);">Cancel</button>
        </div>
      </div>
    </div>
  </div>
    `;
  }

  return {
    init,
    open,
    close,
    save,
    handleFileUpload,
    toggleUnsplashSearch,
    searchUnsplash,
    selectUnsplashImage,
    getModalHTML
  };

})();

window.ForgeImageModal = ForgeImageModal;
