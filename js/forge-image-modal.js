/**
 * ForgeImageModal - Hero Image Modal Component
 * 
 * Extracted from Itinerary implementation with improvements:
 * - Better styling matching FORGE aesthetic (charcoal/gold/orange/cream)
 * - Unsplash search with larger, more visible results (8 results, larger thumbnails)
 * - File upload with base64 conversion
 * - URL paste functionality
 * 
 * Dependencies:
 * - forge-common.css (must be loaded for modal styling)
 * - Lucide icons (must be loaded for icons)
 * 
 * Usage:
 *   ForgeImageModal.init({ modalId: 'imageModal' });
 *   ForgeImageModal.open({
 *     currentUrl: 'https://...',
 *     title: 'Change Hero Image',
 *     onSave: (url) => { ... }
 *   });
 */

const ForgeImageModal = (function() {
  'use strict';

  // ===== CONFIGURATION =====
  const UNSPLASH_WORKER_URL = 'https://trnt-unsplash.damon-be2.workers.dev';
  const UNSPLASH_RESULTS_COUNT = 8; // Show 8 results instead of 12
  const UNSPLASH_THUMBNAIL_SIZE = 160; // Larger thumbnails (was 120px)

  // ===== STATE =====
  let modalId = 'imageModal';
  let modalElement = null;
  let currentCallback = null;
  let unsplashPhotos = []; // Store photo data for selection

  // ===== PUBLIC API =====

  function init(options = {}) {
    modalId = options.modalId || 'imageModal';
    
    // Check if modal already exists
    modalElement = document.getElementById(modalId);
    
    // If not found, inject it
    if (!modalElement) {
      const container = document.body;
      container.insertAdjacentHTML('beforeend', getModalHTML());
      modalElement = document.getElementById(modalId);
      
      // Setup event listeners
      setupEventListeners();
      
      // Inject CSS for modal-specific styling
      injectStyles();
    }
    
    if (!modalElement) {
      console.warn('ForgeImageModal: Modal element not found and could not be injected');
      return;
    }
  }

  function open(options = {}) {
    if (!modalElement) {
      console.warn('ForgeImageModal: Modal not initialized. Call init() first.');
      return;
    }

    currentCallback = options.onSave || null;

    // Pre-fill URL input
    const urlInput = modalElement.querySelector('[data-image-url]');
    if (urlInput) {
      urlInput.value = options.currentUrl || '';
    }

    // Update title if provided
    const titleEl = modalElement.querySelector('[data-modal-title]');
    if (titleEl && options.title) {
      titleEl.textContent = options.title;
    }

    // Reset state
    resetUploadStatus();
    resetUnsplashSearch();

    // Show modal
    modalElement.classList.remove('hidden');

    // Use ForgeEmbed for positioning if available
    if (typeof ForgeEmbed !== 'undefined' && ForgeEmbed.positionModal) {
      const triggerElement = options.triggerElement || document.activeElement;
      ForgeEmbed.positionModal(modalElement, { anchorTo: triggerElement });
    }

    // Render Lucide icons
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // Focus URL input
    if (urlInput) {
      setTimeout(() => urlInput.focus(), 100);
    }
  }

  function close() {
    if (!modalElement) return;

    // Reset position if using ForgeEmbed
    if (typeof ForgeEmbed !== 'undefined' && ForgeEmbed.resetModalPosition) {
      ForgeEmbed.resetModalPosition(modalElement);
    }

    modalElement.classList.add('hidden');
    currentCallback = null;
    unsplashPhotos = [];
  }

  function save() {
    if (!modalElement) return;

    const urlInput = modalElement.querySelector('[data-image-url]');
    if (!urlInput) return;

    const url = urlInput.value.trim();
    
    // Validate URL format (basic check)
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      showToast('Please enter a valid image URL', 'error');
      return;
    }

    // Call callback if provided
    if (currentCallback) {
      currentCallback(url);
    }

    close();
  }

  // ===== FILE UPLOAD =====

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid file type. Please select JPG, PNG, or WebP', 'error');
      return;
    }

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const urlInput = modalElement?.querySelector('[data-image-url]');
      if (urlInput) {
        urlInput.value = dataUrl;
      }
      showToast('Image loaded', 'success');
    };
    reader.onerror = () => {
      showToast('Failed to load image', 'error');
    };
    reader.readAsDataURL(file);
  }

  function resetUploadStatus() {
    const fileInput = modalElement?.querySelector('[data-file-input]');
    if (fileInput) fileInput.value = '';
  }

  // ===== UNSPLASH SEARCH =====

  function toggleUnsplashSearch() {
    if (!modalElement) return;

    const container = modalElement.querySelector('[data-unsplash-container]');
    if (!container) return;

    const wasHidden = container.classList.contains('hidden');
    container.classList.toggle('hidden');

    if (wasHidden) {
      // Container is now visible - scroll modal body to show search input
      setTimeout(() => {
        const modalBody = modalElement.querySelector('.modal-body');
        const searchRow = container.querySelector('.unsplash-search-row');

        if (modalBody && searchRow) {
          // Calculate position of search row relative to modal body
          const modalBodyRect = modalBody.getBoundingClientRect();
          const searchRowRect = searchRow.getBoundingClientRect();

          // Scroll to position the search row near the top of visible area
          const scrollOffset = searchRowRect.top - modalBodyRect.top + modalBody.scrollTop - 20;

          modalBody.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
        } else if (searchRow) {
          // Fallback: try scrollIntoView if modal-body not found
          searchRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Focus the input
        const input = container.querySelector('[data-unsplash-query]');
        if (input) {
          input.focus();
        }
      }, 100);
    } else {
      // Container is now hidden - clear search state
      const input = container.querySelector('[data-unsplash-query]');
      const resultsDiv = container.querySelector('[data-unsplash-results]');
      if (input) input.value = '';
      if (resultsDiv) resultsDiv.innerHTML = '';
      unsplashPhotos = [];
    }
  }

  async function searchUnsplash() {
    if (!modalElement) return;

    const container = modalElement.querySelector('[data-unsplash-container]');
    const queryInput = container?.querySelector('[data-unsplash-query]');
    const resultsDiv = container?.querySelector('[data-unsplash-results]');

    if (!queryInput || !resultsDiv) return;

    const query = queryInput.value.trim();
    if (!query) {
      showToast('Enter a search term', 'error');
      return;
    }

    resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--forge-muted);">Loading...</div>';

    try {
      // Use GET request with URLSearchParams
      const url = `${UNSPLASH_WORKER_URL}/search?` +
        new URLSearchParams({
          query: query,
          per_page: String(UNSPLASH_RESULTS_COUNT),
          orientation: 'landscape'
        }).toString();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to search Unsplash: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--forge-muted);">No results found</div>';
        return;
      }

      // Store photo data
      unsplashPhotos = data.results;

      // Render results
      resultsDiv.innerHTML = '';
      data.results.forEach((photo, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        const img = document.createElement('img');
        img.src = photo.urls.thumb;
        img.alt = photo.description || query;
        img.className = 'unsplash-thumbnail';
        img.dataset.index = index;
        img.onclick = () => selectUnsplashImage(index);

        wrapper.appendChild(img);
        resultsDiv.appendChild(wrapper);
      });

      // Recreate icons if needed
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

    } catch (err) {
      console.error('Unsplash search error:', err);
      resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: #EF4444;">Error searching Unsplash</div>';
      showToast('Failed to search Unsplash', 'error');
    }
  }

  function selectUnsplashImage(index) {
    const photo = unsplashPhotos[index];
    if (!photo) return;

    // Update URL input with selected image (use regular size, not full)
    const urlInput = modalElement?.querySelector('[data-image-url]');
    if (urlInput) {
      urlInput.value = photo.urls.regular;
    }

    // Highlight selected thumbnail
    const thumbnails = modalElement?.querySelectorAll('.unsplash-thumbnail');
    thumbnails?.forEach((thumb, idx) => {
      if (idx === index) {
        thumb.classList.add('selected');
      } else {
        thumb.classList.remove('selected');
      }
    });

    showToast('Image selected', 'success');
  }

  function resetUnsplashSearch() {
    if (!modalElement) return;

    const container = modalElement.querySelector('[data-unsplash-container]');
    if (!container) return;

    container.classList.add('hidden');
    const queryInput = container.querySelector('[data-unsplash-query]');
    const resultsDiv = container.querySelector('[data-unsplash-results]');

    if (queryInput) queryInput.value = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
    unsplashPhotos = [];
  }

  // ===== EVENT LISTENERS =====

  function setupEventListeners() {
    if (!modalElement) return;

    // Close on backdrop click
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) {
        close();
      }
    });

    // File upload handler
    const fileInput = modalElement.querySelector('[data-file-input]');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileUpload);
    }

    // Enter key on search input
    const queryInput = modalElement.querySelector('[data-unsplash-query]');
    if (queryInput) {
      queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          searchUnsplash();
        }
      });
    }
  }

  // ===== UTILITIES =====

  function showToast(message, type = 'success') {
    // Try to use ForgeUtils.UI.showToast if available
    if (typeof ForgeUtils !== 'undefined' && ForgeUtils.UI && ForgeUtils.UI.showToast) {
      ForgeUtils.UI.showToast(message, type);
      return;
    }

    // Fallback: try window.showToast
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    // Last resort: console log
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // ===== HTML TEMPLATE =====

  function getModalHTML() {
    return `
<div id="${modalId}" class="modal-backdrop hidden" onclick="if(event.target === this) ForgeImageModal.close()">
  <div class="modal-content" onclick="event.stopPropagation()">
    <div class="modal-header">
      <div class="flex items-center justify-between">
        <h3 data-modal-title class="text-lg font-semibold">Change Hero Image</h3>
        <button onclick="ForgeImageModal.close()" class="text-gray-400 hover:text-gray-600">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
    </div>
    
    <div class="modal-body">
      <div class="space-y-4">
        <!-- Option 1: Paste URL -->
        <div>
          <label class="form-label" for="${modalId}-image-url" style="color: var(--forge-gold); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: block;">
            Paste Image URL
          </label>
          <input 
            type="text" 
            id="${modalId}-image-url"
            data-image-url 
            class="form-input" 
            placeholder="https://example.com/image.jpg"
          >
        </div>

        <div class="image-modal-divider">— or —</div>

        <!-- Option 2: Upload from Device -->
        <div>
          <input 
            type="file" 
            data-file-input 
            accept="image/jpeg,image/jpg,image/png,image/webp" 
            style="display: none;"
          >
          <button 
            type="button" 
            class="image-option-btn" 
            onclick="document.querySelector('#${modalId} [data-file-input]').click()"
          >
            Upload from Device
          </button>
        </div>

        <div class="image-modal-divider">— or —</div>

        <!-- Option 3: Search Unsplash -->
        <div>
          <button 
            type="button" 
            class="image-option-btn" 
            onclick="ForgeImageModal.toggleUnsplashSearch()"
          >
            Search Unsplash
          </button>
          
          <div data-unsplash-container class="unsplash-search-container hidden">
            <div class="unsplash-search-row">
              <input 
                type="text" 
                data-unsplash-query 
                class="unsplash-search-input" 
                placeholder="Search for images (e.g., 'beach sunset', 'mountain landscape')"
              >
              <button 
                type="button" 
                onclick="ForgeImageModal.searchUnsplash()" 
                class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--forge-gold)] hover:opacity-90 flex-shrink-0"
              >
                Search
              </button>
            </div>
            <div data-unsplash-results class="unsplash-results"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <div class="flex items-center justify-end gap-3">
        <button 
          type="button" 
          onclick="ForgeImageModal.close()" 
          class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          type="button" 
          onclick="ForgeImageModal.save()" 
          class="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[var(--forge-orange)] hover:bg-[var(--forge-orange-hover)]"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</div>
    `.trim();
  }

  // ===== CSS INJECTION =====

  function injectStyles() {
    // Check if styles already injected
    if (document.getElementById('forge-image-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'forge-image-modal-styles';
    style.textContent = `
      /* Modal flex layout (matches Itinerary) */
      #${modalId} .modal-content {
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-height: 90vh;
      }
      
      /* Unsplash thumbnail styles */
      .unsplash-thumbnail {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 6px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.15s ease;
      }
      
      .unsplash-thumbnail:hover {
        border-color: var(--forge-gold);
        transform: scale(1.05);
      }
      
      .unsplash-thumbnail.selected {
        border-color: var(--forge-orange);
        box-shadow: 0 0 0 2px rgba(232, 90, 36, 0.2);
      }
      
      /* Unsplash results grid with larger thumbnails */
      .unsplash-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(${UNSPLASH_THUMBNAIL_SIZE}px, 1fr));
        gap: 0.75rem;
        max-height: 300px;
        overflow-y: auto;
        margin-top: 1rem;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== RETURN PUBLIC API =====

  return {
    init,
    open,
    close,
    save,
    handleFileUpload,
    toggleUnsplashSearch,
    searchUnsplash,
    selectUnsplashImage
  };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForgeImageModal;
}

// Attach to window for browser usage
if (typeof window !== 'undefined') {
  window.ForgeImageModal = ForgeImageModal;
}
