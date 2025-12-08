/**
 * FORGE Embed Mode Module
 * Provides iframe embedding support for TRNT Travel tools
 *
 * @version 2.0.0
 * @author TRNT Travel Tools
 *
 * USAGE:
 * 1. Include this script in your tool's HTML:
 *    <script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/js/forge-embed.js"></script>
 *
 * 2. Initialize with configuration in your DOMContentLoaded:
 *    ForgeEmbed.init({
 *      hideSelectors: ['#adminHeader', '.toolbar-btn-back'],
 *      onLoad: (binId) => { ... },
 *      onRefresh: () => { ... }
 *    });
 *
 * 3. Call ForgeEmbed.notifyDirty(true/false) when changes occur
 * 4. Call ForgeEmbed.notifySaved(binId, title, clientName) after successful save
 *
 * NOTE: v2.0.0 removes injected toolbar - tools now use native .forge-sticky-toolbar
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
body.embed-mode .max-w-7xl { max-width: 100%; padding: 1rem; }
body.embed-mode .modal-backdrop { padding: 8px; }
body.embed-mode .modal-content { max-height: 85vh; overflow-y: auto; }
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
     * @param {Function} config.onLoad - Handler for load command from parent (receives binId)
     * @param {Function} config.onRefresh - Handler for refresh command from parent
     * @param {Array<string>} config.hideSelectors - CSS selectors for elements to hide in embed mode
     * @param {string} config.currentBinId - Current bin ID for notifications (optional)
     */
    init(config = {}) {
      if (this._initialized) {
        console.warn('[ForgeEmbed] Already initialized');
        return this;
      }

      this.config = {
        onLoad: config.onLoad || null,
        onRefresh: config.onRefresh || null,
        hideSelectors: config.hideSelectors || ['#adminHeader'],
        currentBinId: config.currentBinId || null
      };

      // Detect embed mode from URL param
      const urlParams = new URLSearchParams(window.location.search);
      this.isEmbedded = urlParams.get('embed') === 'true' || urlParams.get('embed') === '1';

      if (this.isEmbedded) {
        console.log('[ForgeEmbed] Running in embed mode');
        this._injectCSS();
        this._applyHideClasses();
        document.body.classList.add('embed-mode');
        this._initMessaging();
        // Initialize scroll-aware sticky toolbar positioning
        this._initEmbedStickyToolbar();
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

    // =====================================================
    // STICKY TOOLBAR POSITIONING FOR EMBED MODE
    // =====================================================

    /**
     * Initialize scroll-aware sticky toolbar positioning for embed mode
     * In embed mode, position: fixed doesn't work because the iframe auto-sizes
     * to content height. This repositions the toolbar based on parent scroll.
     */
    _initEmbedStickyToolbar() {
      if (!this.isEmbedded) return;

      const toolbar = document.querySelector('.forge-sticky-toolbar');
      if (!toolbar) {
        console.log('[ForgeEmbed] No .forge-sticky-toolbar found');
        return;
      }

      console.log('[ForgeEmbed] Initializing scroll-aware sticky toolbar');

      // Switch from fixed to absolute positioning so we can control it
      toolbar.style.position = 'absolute';
      toolbar.style.bottom = 'auto';

      const repositionToolbar = () => {
        try {
          const iframeRect = window.frameElement?.getBoundingClientRect();
          if (!iframeRect) return;

          const parentViewportHeight = window.parent.innerHeight;
          const toolbarHeight = toolbar.offsetHeight;

          // Where is the bottom of the parent viewport relative to our iframe?
          const viewportBottomInIframe = parentViewportHeight - iframeRect.top;

          // Clamp to iframe bounds
          const iframeHeight = document.documentElement.scrollHeight;
          const targetBottom = Math.min(viewportBottomInIframe, iframeHeight);
          const targetTop = Math.max(0, targetBottom - toolbarHeight);

          toolbar.style.top = targetTop + 'px';
        } catch (e) {
          // Cross-origin issues - fall back to bottom of iframe
          console.log('[ForgeEmbed] Cross-origin fallback for toolbar');
          toolbar.style.position = 'fixed';
          toolbar.style.bottom = '0';
          toolbar.style.top = 'auto';
        }
      };

      // Listen to parent scroll and resize
      try {
        window.parent.addEventListener('scroll', repositionToolbar, { passive: true });
        window.parent.addEventListener('resize', repositionToolbar, { passive: true });
        console.log('[ForgeEmbed] Parent scroll/resize listeners attached');
      } catch (e) {
        console.log('[ForgeEmbed] Could not attach parent listeners (cross-origin)');
      }

      // Initial position
      repositionToolbar();

      // Also reposition when iframe content changes height
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(repositionToolbar);
        resizeObserver.observe(document.body);
      }

      // Store reference for potential cleanup
      this._repositionToolbar = repositionToolbar;
    }
  };

  // =====================================================
  // EXPORT TO GLOBAL SCOPE
  // =====================================================
  global.ForgeEmbed = ForgeEmbed;

  // Log availability
  console.log('[ForgeEmbed] Module loaded v2.0.0 - call ForgeEmbed.init(config) to initialize');

})(typeof window !== 'undefined' ? window : this);
