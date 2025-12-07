/**
 * FORGE Embed Mode Module
 * Provides iframe embedding support for TRNT Travel tools
 * 
 * @version 1.0.0
 * @author TRNT Travel Tools
 * 
 * USAGE:
 * 1. Include this script in your tool's HTML:
 *    <script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/js/forge-embed.js"></script>
 * 
 * 2. Initialize with configuration in your DOMContentLoaded:
 *    ForgeEmbed.init({
 *      onSave: async () => { ... },
 *      onSaveAsNew: async () => { ... },
 *      onRevert: async () => { ... },
 *      onExportPDF: () => { ... },
 *      onLoad: (binId) => { ... },
 *      onRefresh: () => { ... },
 *      hideSelectors: ['#adminHeader', '#somePanel'],
 *      showPdfButton: true
 *    });
 * 
 * 3. Call ForgeEmbed.notifyDirty(true/false) when changes occur
 * 4. Call ForgeEmbed.notifySaved(binId, title, clientName) after successful save
 */

(function(global) {
  'use strict';

  // =====================================================
  // EMBED MODE CSS (injected dynamically)
  // =====================================================
  const EMBED_CSS = `
/* ===========================================
   FORGE EMBED MODE STYLES
   =========================================== */
body.embed-mode .forge-embed-hide { display: none !important; }
body.embed-mode .max-w-7xl { max-width: 100%; padding: 1rem; padding-bottom: 80px; }
body.embed-mode .modal-backdrop { padding: 8px; }
body.embed-mode .modal-content { max-height: 85vh; overflow-y: auto; }

/* Floating save bar for embed mode */
#forgeEmbedSaveBar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid var(--trnt-border, #90867C);
  padding: 12px 16px;
  z-index: 50;
  box-shadow: 0 -4px 6px rgba(0,0,0,0.1);
}

body.embed-mode #forgeEmbedSaveBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

#forgeEmbedSaveBar .embed-status {
  font-size: 14px;
  color: var(--trnt-secondary, #90867C);
}

#forgeEmbedSaveBar .embed-status.has-changes {
  color: #d97706;
  font-weight: 500;
}

#forgeEmbedSaveBar .embed-actions {
  display: flex;
  gap: 8px;
}

#forgeEmbedSaveBar .embed-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

#forgeEmbedSaveBar .embed-btn:hover { opacity: 0.9; }
#forgeEmbedSaveBar .embed-btn:disabled { opacity: 0.5; cursor: not-allowed; }

#forgeEmbedSaveBar .embed-btn-save {
  background: var(--btn-create, #6B8E6B);
  color: white;
}

#forgeEmbedSaveBar .embed-btn-saveas {
  background: var(--btn-secondary, #AD845B);
  color: white;
}

#forgeEmbedSaveBar .embed-btn-revert {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

#forgeEmbedSaveBar .embed-btn-pdf {
  background: var(--btn-special, #8B7093);
  color: white;
}
`;

  // =====================================================
  // EMBED SAVE BAR HTML TEMPLATE
  // =====================================================
  const SAVE_BAR_HTML = `
<div id="forgeEmbedSaveBar">
  <span class="embed-status">All changes saved</span>
  <div class="embed-actions">
    <button class="embed-btn embed-btn-save" data-action="save" disabled>Save Changes</button>
    <button class="embed-btn embed-btn-saveas" data-action="saveas">Save As New</button>
    <button class="embed-btn embed-btn-revert" data-action="revert" disabled>Revert</button>
    <button class="embed-btn embed-btn-pdf" data-action="pdf">Export PDF</button>
  </div>
</div>
`;

  // =====================================================
  // FORGE EMBED MODULE
  // =====================================================
  const ForgeEmbed = {
    // State
    isEmbedded: false,
    parentOrigin: null,
    config: null,
    _initialized: false,

    /**
     * Initialize embed mode
     * @param {Object} config - Configuration options
     * @param {Function} config.onSave - Handler for save button click
     * @param {Function} config.onSaveAsNew - Handler for save as new button click
     * @param {Function} config.onRevert - Handler for revert button click
     * @param {Function} config.onExportPDF - Handler for export PDF button click
     * @param {Function} config.onLoad - Handler for load command from parent (receives binId)
     * @param {Function} config.onRefresh - Handler for refresh command from parent
     * @param {Array<string>} config.hideSelectors - CSS selectors for elements to hide in embed mode
     * @param {boolean} config.showPdfButton - Whether to show the PDF export button (default: true)
     * @param {boolean} config.showSaveAsNew - Whether to show Save As New button (default: true)
     * @param {string} config.currentBinId - Current bin ID for notifications (optional)
     */
    init(config = {}) {
      if (this._initialized) {
        console.warn('[ForgeEmbed] Already initialized');
        return this;
      }

      this.config = {
        onSave: config.onSave || (() => console.warn('[ForgeEmbed] No onSave handler configured')),
        onSaveAsNew: config.onSaveAsNew || (() => console.warn('[ForgeEmbed] No onSaveAsNew handler configured')),
        onRevert: config.onRevert || (() => console.warn('[ForgeEmbed] No onRevert handler configured')),
        onExportPDF: config.onExportPDF || (() => console.warn('[ForgeEmbed] No onExportPDF handler configured')),
        onLoad: config.onLoad || null,
        onRefresh: config.onRefresh || null,
        hideSelectors: config.hideSelectors || ['#adminHeader'],
        showPdfButton: config.showPdfButton !== false,
        showSaveAsNew: config.showSaveAsNew !== false,
        currentBinId: config.currentBinId || null
      };

      // Detect embed mode from URL param
      const urlParams = new URLSearchParams(window.location.search);
      this.isEmbedded = urlParams.get('embed') === 'true' || urlParams.get('embed') === '1';

      if (this.isEmbedded) {
        console.log('[ForgeEmbed] Running in embed mode');
        this._injectCSS();
        this._injectSaveBar();
        this._applyHideClasses();
        document.body.classList.add('embed-mode');
        this._initMessaging();
        this._bindSaveBarEvents();
      } else {
        console.log('[ForgeEmbed] Not in embed mode, skipping initialization');
      }

      this._initialized = true;
      return this;
    },

    /**
     * Check if currently running in embed mode
     * @returns {boolean}
     */
    isEmbedMode() {
      return this.isEmbedded;
    },

    /**
     * Update the current bin ID (useful after loading new data)
     * @param {string} binId
     */
    setCurrentBinId(binId) {
      if (this.config) {
        this.config.currentBinId = binId;
      }
    },

    // =====================================================
    // PARENT COMMUNICATION
    // =====================================================

    /**
     * Notify parent window of an event
     * @param {string} action - Action name (e.g., 'forge:saved', 'forge:dirty')
     * @param {Object} data - Data to send
     */
    notifyParent(action, data = {}) {
      if (!this.isEmbedded) return;

      const origin = this.parentOrigin || '*';
      window.parent.postMessage({ action, data }, origin);
      console.log('[ForgeEmbed] Sent to parent:', action, data);
    },

    /**
     * Notify parent that data was saved successfully
     * @param {string} binId - The bin ID that was saved
     * @param {string} title - Trip/item title
     * @param {string} clientName - Client name
     */
    notifySaved(binId, title, clientName) {
      this.notifyParent('forge:saved', { binId, title, clientName });
      this.notifyDirty(false); // Reset dirty state after save
    },

    /**
     * Notify parent of dirty/clean state change
     * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
     */
    notifyDirty(hasUnsavedChanges) {
      this.notifyParent('forge:dirty', { 
        binId: this.config?.currentBinId, 
        hasUnsavedChanges 
      });
      this._updateSaveBar(hasUnsavedChanges);
    },

    /**
     * Notify parent that the tool is ready to receive commands
     */
    notifyReady() {
      this.notifyParent('forge:ready', {
        binId: this.config?.currentBinId
      });
    },

    /**
     * Notify parent of content height for dynamic iframe resizing
     */
    notifyHeight() {
      if (!this.isEmbedded) return;
      const height = document.body.scrollHeight;
      this.notifyParent('forge:resize', { height });
    },

    // =====================================================
    // PRIVATE METHODS
    // =====================================================

    _injectCSS() {
      if (document.getElementById('forge-embed-styles')) return;

      const styleEl = document.createElement('style');
      styleEl.id = 'forge-embed-styles';
      styleEl.textContent = EMBED_CSS;
      document.head.appendChild(styleEl);
      console.log('[ForgeEmbed] CSS injected');
    },

    _injectSaveBar() {
      if (document.getElementById('forgeEmbedSaveBar')) return;

      // Insert save bar before closing body tag
      document.body.insertAdjacentHTML('beforeend', SAVE_BAR_HTML);
      
      // Hide PDF button if configured
      if (!this.config.showPdfButton) {
        const pdfBtn = document.querySelector('#forgeEmbedSaveBar .embed-btn-pdf');
        if (pdfBtn) pdfBtn.style.display = 'none';
      }
      
      // Hide Save As New button if configured
      if (!this.config.showSaveAsNew) {
        const saveAsBtn = document.querySelector('#forgeEmbedSaveBar .embed-btn-saveas');
        if (saveAsBtn) saveAsBtn.style.display = 'none';
      }
      
      console.log('[ForgeEmbed] Save bar injected');
    },

    _applyHideClasses() {
      // Add the forge-embed-hide class to configured selectors
      this.config.hideSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.classList.add('forge-embed-hide');
        });
      });
      console.log('[ForgeEmbed] Hide classes applied to:', this.config.hideSelectors);
    },

    _initMessaging() {
      window.addEventListener('message', (event) => {
        // Validate origin - accept same domain family
        const currentDomain = window.location.hostname.split('.').slice(-2).join('.');
        const eventDomain = new URL(event.origin).hostname.split('.').slice(-2).join('.');
        
        if (currentDomain !== eventDomain) {
          console.warn('[ForgeEmbed] Message from unknown origin:', event.origin);
          return;
        }

        this.parentOrigin = event.origin;
        const { action, data } = event.data || {};

        console.log('[ForgeEmbed] Received message:', action, data);

        switch (action) {
          case 'forge:load':
            if (data?.binId && this.config.onLoad) {
              this.config.onLoad(data.binId);
            }
            break;
          case 'forge:refresh':
            if (this.config.onRefresh) {
              this.config.onRefresh();
            }
            break;
        }
      });

      // Notify parent we're ready (with small delay to ensure DOM is ready)
      setTimeout(() => {
        this.notifyReady();
        // Send initial height after DOM settles
        setTimeout(() => this.notifyHeight(), 50);
      }, 100);

      // Set up ResizeObserver to detect content changes and notify parent
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => {
          this.notifyHeight();
        });
        this._resizeObserver.observe(document.body);
        console.log('[ForgeEmbed] ResizeObserver attached for dynamic height');
      }
    },

    _bindSaveBarEvents() {
      const saveBar = document.getElementById('forgeEmbedSaveBar');
      if (!saveBar) return;

      // Use event delegation for button clicks
      saveBar.addEventListener('click', async (e) => {
        const btn = e.target.closest('.embed-btn');
        if (!btn || btn.disabled) return;

        const action = btn.dataset.action;
        
        // Disable button during operation to prevent double-clicks
        btn.disabled = true;
        const originalText = btn.textContent;
        
        try {
          switch (action) {
            case 'save':
              btn.textContent = 'Saving...';
              await this.config.onSave();
              break;
            case 'saveas':
              btn.textContent = 'Creating...';
              await this.config.onSaveAsNew();
              break;
            case 'revert':
              await this.config.onRevert();
              break;
            case 'pdf':
              btn.textContent = 'Exporting...';
              await this.config.onExportPDF();
              break;
          }
        } catch (error) {
          console.error('[ForgeEmbed] Action failed:', action, error);
        } finally {
          btn.textContent = originalText;
          // Re-enable based on current dirty state
          // Save and Revert should stay disabled if no changes
          if (action !== 'save' && action !== 'revert') {
            btn.disabled = false;
          }
        }
      });

      console.log('[ForgeEmbed] Save bar events bound');
    },

    _updateSaveBar(hasChanges) {
      const status = document.querySelector('#forgeEmbedSaveBar .embed-status');
      const saveBtn = document.querySelector('#forgeEmbedSaveBar .embed-btn-save');
      const revertBtn = document.querySelector('#forgeEmbedSaveBar .embed-btn-revert');

      if (status) {
        if (hasChanges) {
          status.textContent = 'You have unsaved changes';
          status.classList.add('has-changes');
        } else {
          status.textContent = 'All changes saved';
          status.classList.remove('has-changes');
        }
      }

      if (saveBtn) saveBtn.disabled = !hasChanges;
      if (revertBtn) revertBtn.disabled = !hasChanges;
    }
  };

  // =====================================================
  // EXPORT TO GLOBAL SCOPE
  // =====================================================
  global.ForgeEmbed = ForgeEmbed;

  // Log availability
  console.log('[ForgeEmbed] Module loaded - call ForgeEmbed.init(config) to initialize');

})(typeof window !== 'undefined' ? window : this);
