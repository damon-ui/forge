/**
 * ForgeImageModal - Hero Image Modal Component
 * 
 * Features:
 * - Paste from clipboard (Cmd+V after copying any image)
 * - Drag & drop images
 * - File upload from device
 * - URL paste functionality
 * - Unsplash search
 * - Client-side compression before upload
 * - R2 cloud storage (images hosted by FORGE)
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
 *     onSave: (url) => { ... },
 *     advisorId: 'abc123',  // Optional: for organizing uploads
 *     category: 'ships'     // Optional: ships, hotels, destinations, misc
 *   });
 */

const ForgeImageModal = (function() {
  'use strict';

  // ===== CONFIGURATION =====
  const UNSPLASH_WORKER_URL = 'https://trnt-unsplash.damon-be2.workers.dev';
  const IMAGE_UPLOAD_WORKER_URL = 'https://forge-image-upload.damon-be2.workers.dev';
  const UNSPLASH_RESULTS_COUNT = 8;
  const UNSPLASH_THUMBNAIL_SIZE = 160;
  
  // Compression settings
  const MAX_IMAGE_DIMENSION = 1600; // Max width or height
  const JPEG_QUALITY = 0.85;        // 85% quality
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB after compression

  // ===== STATE =====
  let modalId = 'imageModal';
  let modalElement = null;
  let currentCallback = null;
  let currentOptions = {};
  let unsplashPhotos = [];
  let isUploading = false;

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
    currentOptions = {
      advisorId: options.advisorId || 'shared',
      category: options.category || 'misc'
    };

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
    hideUploadProgress();

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
    currentOptions = {};
    unsplashPhotos = [];
    isUploading = false;
  }

  function save() {
    if (!modalElement || isUploading) return;

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

  // ===== IMAGE COMPRESSION =====

  async function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          JPEG_QUALITY
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));

      // Load image from file
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // ===== R2 UPLOAD =====

  async function uploadToR2(blob, filename) {
    const formData = new FormData();
    formData.append('file', blob, filename || 'image.jpg');
    formData.append('advisor_id', currentOptions.advisorId || 'shared');
    formData.append('category', currentOptions.category || 'misc');

    const response = await fetch(`${IMAGE_UPLOAD_WORKER_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.url;
  }

  // ===== UPLOAD PROGRESS UI =====

  function showUploadProgress(message = 'Uploading...') {
    isUploading = true;
    const progressEl = modalElement?.querySelector('[data-upload-progress]');
    const progressText = modalElement?.querySelector('[data-upload-text]');
    if (progressEl) {
      progressEl.classList.remove('hidden');
      if (progressText) progressText.textContent = message;
    }
    
    // Disable save button during upload
    const saveBtn = modalElement?.querySelector('[data-save-btn]');
    if (saveBtn) saveBtn.disabled = true;
  }

  function hideUploadProgress() {
    isUploading = false;
    const progressEl = modalElement?.querySelector('[data-upload-progress]');
    if (progressEl) {
      progressEl.classList.add('hidden');
    }
    
    // Re-enable save button
    const saveBtn = modalElement?.querySelector('[data-save-btn]');
    if (saveBtn) saveBtn.disabled = false;
  }

  // ===== PROCESS IMAGE (compress + upload) =====

  async function processAndUploadImage(file) {
    if (isUploading) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid file type. Please use JPG, PNG, or WebP', 'error');
      return;
    }

    try {
      showUploadProgress('Compressing...');

      // Compress the image
      const compressedBlob = await compressImage(file);
      
      // Check size after compression
      if (compressedBlob.size > MAX_FILE_SIZE) {
        hideUploadProgress();
        showToast('Image too large even after compression. Try a smaller image.', 'error');
        return;
      }

      showUploadProgress('Uploading...');

      // Upload to R2
      const url = await uploadToR2(compressedBlob, file.name);

      // Set the URL in the input
      const urlInput = modalElement?.querySelector('[data-image-url]');
      if (urlInput) {
        urlInput.value = url;
      }

      hideUploadProgress();
      showToast('Image uploaded!', 'success');

    } catch (error) {
      console.error('Image upload error:', error);
      hideUploadProgress();
      showToast(error.message || 'Failed to upload image', 'error');
    }
  }

  // ===== CLIPBOARD PASTE =====

  async function handlePaste(event) {
    if (!modalElement || isUploading) return;
    
    // Only handle paste when modal is visible
    if (modalElement.classList.contains('hidden')) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processAndUploadImage(file);
        }
        return;
      }
    }
    
    // If no image in clipboard, let normal paste happen (for URL text)
  }

  // ===== DRAG & DROP =====

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = modalElement?.querySelector('[data-drop-zone]');
    if (dropZone) {
      dropZone.classList.add('drag-over');
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = modalElement?.querySelector('[data-drop-zone]');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = modalElement?.querySelector('[data-drop-zone]');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }

    if (isUploading) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await processAndUploadImage(file);
      } else {
        showToast('Please drop an image file', 'error');
      }
    }
  }

  // ===== FILE UPLOAD (via button) =====

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    await processAndUploadImage(file);
    
    // Reset file input
    event.target.value = '';
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
      setTimeout(() => {
        const modalBody = modalElement.querySelector('.modal-body');
        const searchRow = container.querySelector('.unsplash-search-row');

        if (modalBody && searchRow) {
          const modalBodyRect = modalBody.getBoundingClientRect();
          const searchRowRect = searchRow.getBoundingClientRect();
          const scrollOffset = searchRowRect.top - modalBodyRect.top + modalBody.scrollTop - 20;
          modalBody.scrollTo({ top: scrollOffset, behavior: 'smooth' });
        }

        const input = container.querySelector('[data-unsplash-query]');
        if (input) input.focus();
      }, 100);
    } else {
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
      const url = `${UNSPLASH_WORKER_URL}/search?` +
        new URLSearchParams({
          query: query,
          per_page: String(UNSPLASH_RESULTS_COUNT),
          orientation: 'landscape'
        }).toString();

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to search Unsplash: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--forge-muted);">No results found</div>';
        return;
      }

      unsplashPhotos = data.results;
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

      if (window.lucide?.createIcons) window.lucide.createIcons();

    } catch (err) {
      console.error('Unsplash search error:', err);
      resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: #EF4444;">Error searching Unsplash</div>';
      showToast('Failed to search Unsplash', 'error');
    }
  }

  function selectUnsplashImage(index) {
    const photo = unsplashPhotos[index];
    if (!photo) return;

    const urlInput = modalElement?.querySelector('[data-image-url]');
    if (urlInput) {
      urlInput.value = photo.urls.regular;
    }

    const thumbnails = modalElement?.querySelectorAll('.unsplash-thumbnail');
    thumbnails?.forEach((thumb, idx) => {
      thumb.classList.toggle('selected', idx === index);
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
      if (e.target === modalElement) close();
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

    // Drag & drop on drop zone
    const dropZone = modalElement.querySelector('[data-drop-zone]');
    if (dropZone) {
      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
    }

    // Global paste listener (works when modal is open)
    document.addEventListener('paste', handlePaste);
  }

  // ===== UTILITIES =====

  function showToast(message, type = 'success') {
    if (typeof ForgeUtils !== 'undefined' && ForgeUtils.UI?.showToast) {
      ForgeUtils.UI.showToast(message, type);
      return;
    }
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // ===== HTML TEMPLATE =====

  function getModalHTML() {
    return `
<div id="${modalId}" class="modal-backdrop hidden" onclick="if(event.target === this) ForgeImageModal.close()">
  <div class="modal-content" onclick="event.stopPropagation()">
    <div class="modal-header">
      <div class="flex items-center justify-between">
        <h3 data-modal-title class="text-lg font-semibold">Change Image</h3>
        <button onclick="ForgeImageModal.close()" class="text-gray-400 hover:text-gray-600">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
    </div>
    
    <div class="modal-body">
      <div class="space-y-4">
        
        <!-- Upload Progress Indicator -->
        <div data-upload-progress class="hidden">
          <div class="upload-progress-bar">
            <div class="upload-progress-spinner"></div>
            <span data-upload-text>Uploading...</span>
          </div>
        </div>
        
        <!-- Drop Zone (also handles paste) -->
        <div data-drop-zone class="drop-zone">
          <div class="drop-zone-content">
            <i data-lucide="image-plus" class="w-8 h-8 text-gray-400 mb-2"></i>
            <p class="drop-zone-text">
              <strong>Drop image here</strong> or <strong>paste from clipboard</strong>
            </p>
            <p class="drop-zone-hint">
              Tip: Copy any image from the web, then press Cmd+V (Mac) or Ctrl+V (Windows)
            </p>
          </div>
        </div>

        <div class="image-modal-divider">\u2014 or \u2014</div>

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

        <div class="image-modal-divider">\u2014 or \u2014</div>

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
            <i data-lucide="upload" class="w-4 h-4"></i>
            Upload from Device
          </button>
        </div>

        <div class="image-modal-divider">\u2014 or \u2014</div>

        <!-- Option 3: Search Unsplash -->
        <div>
          <button 
            type="button" 
            class="image-option-btn" 
            onclick="ForgeImageModal.toggleUnsplashSearch()"
          >
            <i data-lucide="search" class="w-4 h-4"></i>
            Search Unsplash
          </button>
          
          <div data-unsplash-container class="unsplash-search-container hidden">
            <div class="unsplash-search-row">
              <input 
                type="text" 
                data-unsplash-query 
                class="unsplash-search-input" 
                placeholder="Search (e.g., 'cruise ship', 'beach resort')"
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
          data-save-btn
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
    if (document.getElementById('forge-image-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'forge-image-modal-styles';
    style.textContent = `
      /* Modal flex layout */
      #${modalId} .modal-content {
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-height: 90vh;
      }
      
      /* Drop Zone */
      .drop-zone {
        border: 2px dashed var(--forge-border, #E5E5E5);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.2s ease;
        background: var(--forge-cream, #FAF9F7);
        cursor: pointer;
      }
      
      .drop-zone:hover,
      .drop-zone.drag-over {
        border-color: var(--forge-gold, #D4AF7A);
        background: rgba(212, 175, 122, 0.1);
      }
      
      .drop-zone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      }
      
      .drop-zone-text {
        font-size: 0.875rem;
        color: var(--forge-charcoal, #1C2A3A);
        margin: 0;
      }
      
      .drop-zone-hint {
        font-size: 0.75rem;
        color: var(--forge-muted, #6F7276);
        margin-top: 0.5rem;
      }
      
      /* Upload Progress */
      .upload-progress-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(212, 175, 122, 0.15);
        border-radius: 8px;
        font-size: 0.875rem;
        color: var(--forge-charcoal, #1C2A3A);
      }
      
      .upload-progress-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--forge-border, #E5E5E5);
        border-top-color: var(--forge-gold, #D4AF7A);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Image option buttons */
      .image-option-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--forge-border, #E5E5E5);
        border-radius: 8px;
        background: white;
        color: var(--forge-charcoal, #1C2A3A);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      
      .image-option-btn:hover {
        border-color: var(--forge-gold, #D4AF7A);
        background: rgba(212, 175, 122, 0.1);
      }
      
      /* Unsplash thumbnails */
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
      
      .unsplash-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(${UNSPLASH_THUMBNAIL_SIZE}px, 1fr));
        gap: 0.75rem;
        max-height: 300px;
        overflow-y: auto;
        margin-top: 1rem;
      }
      
      /* Divider */
      .image-modal-divider {
        text-align: center;
        color: var(--forge-muted, #6F7276);
        font-size: 0.75rem;
        margin: 0.5rem 0;
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
