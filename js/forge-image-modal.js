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
    modalElement = document.getElementById(options.modalId || 'imageModal');
    if (!modalElement) {
      console.warn('ForgeImageModal: Modal element not found');
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

    // TRN-201: In embed mode, position modal at current viewport center
    const isEmbed = new URLSearchParams(window.location.search).get('embed') !== null;
    if (isEmbed) {
      const modalContent = modalElement.querySelector('.modal-content');
      if (modalContent) {
        modalContent.style.position = 'absolute';
        modalContent.style.top = (window.scrollY + (window.innerHeight / 2)) + 'px';
        modalContent.style.left = '50%';
        modalContent.style.transform = 'translate(-50%, -50%)';
      }
    }
  }

  function close() {
    if (!modalElement) return;

    // TRN-201: Reset modal positioning
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.position = '';
      modalContent.style.top = '';
      modalContent.style.transform = '';
      modalContent.style.left = '';
    }

    modalElement.classList.remove('active');
    currentCallback = null;
  }

  function save() {
    const urlInput = modalElement?.querySelector('[data-image-url]');
    const url = urlInput?.value?.trim();

    if (!url) {
      ForgeUtils.UI.showToast('Please enter an image URL', 'error');
      return;
    }

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
    const title = options.title || 'Select Image';

    return `
      <div id="${modalId}" class="modal-backdrop">
        <div class="modal-content">
          <h3 data-modal-title style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">${title}</h3>

          <!-- URL Input -->
          <div style="margin-bottom: 1rem;">
            <label class="form-label">Paste Image URL</label>
            <input type="text" data-image-url class="form-input" placeholder="https://..." />
          </div>

          <!-- File Upload -->
          <div style="margin-bottom: 1rem;">
            <label class="form-label">Or Upload Image</label>
            <input type="file" data-file-input accept="image/*" onchange="ForgeImageModal.handleFileUpload(event)"
                   style="width: 100%; font-size: 0.875rem;" />
            <div data-upload-status class="text-xs mt-1 text-center"></div>
          </div>

          <!-- Unsplash Search Toggle -->
          <button type="button" onclick="ForgeImageModal.toggleUnsplashSearch()"
                  class="btn btn-outline" style="width: 100%; margin-bottom: 0.75rem;">
            Search Unsplash
          </button>

          <!-- Unsplash Panel (hidden by default) -->
          <div data-unsplash-panel class="hidden unsplash-search-container">
            <div class="unsplash-search-input">
              <input type="text" data-unsplash-query placeholder="Search free photos..."
                     onkeydown="if(event.key==='Enter'){ForgeImageModal.searchUnsplash();}" />
              <button type="button" data-unsplash-search-btn onclick="ForgeImageModal.searchUnsplash()">Search</button>
            </div>
            <div data-unsplash-results></div>
            <p class="unsplash-credit">Photos from <a href="https://unsplash.com" target="_blank">Unsplash</a></p>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
            <button type="button" onclick="ForgeImageModal.close()" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="button" onclick="ForgeImageModal.save()" class="btn btn-primary" style="flex: 1;">Save</button>
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
