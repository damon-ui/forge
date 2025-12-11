/**
 * FORGE - JavaScript Utility Library
 * Version: 3.2.27
 * Date: December 10, 2025
 * 
 * Lightweight utility library for date formatting, price calculations, 
 * and data validation in travel applications.
 * 
 * Categories:
 * 1. Date Formatting
 * 2. Price Formatting
 * 3. Metadata Generation
 * 4. Label Generation
 * 5. Validation
 * 6. Storage Helpers (JSONBin)
 * 7. UI Helpers (Toast, Spinner, Banners, Confirm Modal)
 * 8. Data Migration
 */

const ForgeUtils = (function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    VERSION: '3.2.27',
    EMOJI: {
      SHIP: '\u{1F6A2}',
      PLANE: '\u{2708}\u{FE0F}',
      HOTEL: '\u{1F3E8}',
      CALENDAR: '\u{1F4C5}',
      MONEY: '\u{1F4B5}',
      CHECK: '\u{2705}',
      WARNING: '\u{26A0}\u{FE0F}',
      ERROR: '\u{274C}'
    }
  };

  // ============================================
  // VIEW MODE STATE (for banner system)
  // ============================================
  let currentViewMode = 'admin';

  // ============================================
  // 1. DATE UTILITIES
  // ============================================
  const DateUtils = {
    /**
     * Parse an ISO date string (YYYY-MM-DD) as a local Date without timezone shift.
     * Returns null if invalid.
     */
    parseLocal(isoDate) {
      if (!isoDate) return null;
      const parts = String(isoDate).split('-');
      if (parts.length !== 3) return null;
      const [y, m, d] = parts.map(n => parseInt(n, 10));
      if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
        return null; // prevent rollover (e.g., 2025-02-31)
      }
      return date;
    },

    /**
     * Convert a Date (or date-like string) to ISO YYYY-MM-DD.
     * Returns '' on invalid input.
     */
    toISO(dateInput) {
      if (!dateInput) return '';
      if (dateInput instanceof Date) {
        return Number.isNaN(dateInput.getTime()) ? '' : dateInput.toISOString().split('T')[0];
      }
      const parsed = this.parseLocal(dateInput);
      return parsed ? parsed.toISOString().split('T')[0] : '';
    },

    /**
     * Friendly single-date formatting.
     * Examples: "Mar 15, 2026" (default) or "March 15, 2026" (month: 'long').
     */
    formatFriendly(dateStr, options = {}) {
      const {
        month = 'short',
        includeYear = true,
        weekday = false
      } = options;

      const date = this.parseLocal(dateStr);
      if (!date) return dateStr || '';

      const formatOptions = { month, day: 'numeric' };
      if (includeYear) formatOptions.year = 'numeric';
      if (weekday) formatOptions.weekday = weekday === true ? 'short' : weekday;

      return date.toLocaleDateString('en-US', formatOptions);
    },

    /**
     * Friendly range formatting with smart year handling.
     * Same year: "Mar 15 - Mar 22, 2026"
     * Different years: "Dec 30, 2026 - Jan 3, 2027"
     */
    formatRangeFriendly(startDate, endDate) {
      if (!startDate || !endDate) return '';
      const start = this.parseLocal(startDate);
      const end = this.parseLocal(endDate);
      if (!start || !end) return `${startDate} - ${endDate}`;

      const sameYear = start.getFullYear() === end.getFullYear();
      const sameMonth = sameYear && start.getMonth() === end.getMonth();

      const startOpts = { month: 'short', day: 'numeric', includeYear: !sameYear };
      const endOpts = { month: 'short', day: 'numeric', includeYear: true };

      const startStr = this.formatFriendly(startDate, startOpts);
      const endStr = this.formatFriendly(endDate, endOpts);

      if (sameYear && sameMonth) {
        return `${startStr}-${end.getDate()}, ${end.getFullYear()}`;
      }

      return `${startStr} - ${endStr}`;
    },

    /**
     * Format "HH:MM" (24h) to "h:mm AM/PM".
     * Handles "8:05", "08:05", "20:30". Returns original on invalid.
     */
    formatTime12(timeStr) {
      if (!timeStr) return '';
      const parts = String(timeStr).split(':');
      if (parts.length < 2) return timeStr;
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1].padStart(2, '0');
      if (Number.isNaN(hours)) return timeStr;

      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12; // 0 -> 12 AM, 12 -> 12 PM
      return `${displayHour}:${minutes} ${ampm}`;
    },

    formatDate(isoDate, format = 'MM/DD/YYYY') {
      if (!isoDate) return '';
      
      try {
        const date = new Date(isoDate + 'T00:00:00');
        if (isNaN(date.getTime())) return isoDate;
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const month = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        
        const patterns = {
          'MM/DD/YYYY': `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`,
          'MMM DD, YYYY': `${months[month]} ${day}, ${year}`,
          'MMMM DD, YYYY': `${monthsFull[month]} ${day}, ${year}`,
          'MMM DD': `${months[month]} ${day}`,
          'YYYY-MM-DD': isoDate
        };
        
        return patterns[format] || patterns['MM/DD/YYYY'];
      } catch (error) {
        console.error('Date formatting error:', error);
        return isoDate;
      }
    },

    parseDate(dateString) {
      if (!dateString) return '';
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Date parsing error:', error);
        return dateString;
      }
    },

    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) return '';
      
      try {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return `${startDate} - ${endDate}`;
        }
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const startMonth = months[start.getMonth()];
        const endMonth = months[end.getMonth()];
        const startDay = start.getDate();
        const endDay = end.getDate();
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        
        if (startMonth === endMonth && startYear === endYear) {
          return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
        }
        
        if (startYear === endYear) {
          return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
        }
        
        return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
      } catch (error) {
        console.error('Date range formatting error:', error);
        return `${startDate} - ${endDate}`;
      }
    },

    calculateNights(startDate, endDate) {
      if (!startDate || !endDate) return 0;
      
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      } catch (error) {
        console.error('Night calculation error:', error);
        return 0;
      }
    },

    getCurrentTimestamp() {
      return new Date().toISOString();
    },

    extractYear(dateString) {
      if (!dateString) return '';
      
      try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString.substring(0, 4);
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.getFullYear().toString();
      } catch (error) {
        console.error('Year extraction error:', error);
        return '';
      }
    }
  };

  // ============================================
  // 2. PRICE UTILITIES
  // ============================================
  const PriceUtils = {
    formatPrice(amount, includeCents = false) {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return '$0';
      }
      
      const num = Number(amount);
      
      if (includeCents) {
        return `$${num.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      }
      
      return `$${Math.round(num).toLocaleString('en-US')}`;
    },

    calculatePricePerPerson(total, guests) {
      if (!total || !guests || guests === 0) return 0;
      return Math.round(Number(total) / Number(guests));
    },

    calculateGrandTotal(pricing) {
      if (!pricing) return 0;
      
      let total = 0;
      
      if (pricing.packageTotal) {
        total += Number(pricing.packageTotal);
      }
      
      if (pricing.flightsTotal) {
        total += Number(pricing.flightsTotal);
      }
      
      if (pricing.prePostHotelsTotal) {
        total += Number(pricing.prePostHotelsTotal);
      }
      
      if (pricing.additionalCosts) {
        total += Number(pricing.additionalCosts);
      }
      
      return total;
    },

    parsePrice(priceString) {
      if (!priceString) return 0;
      
      const cleaned = String(priceString).replace(/[$,\s]/g, '');
      const num = parseFloat(cleaned);
      
      return isNaN(num) ? 0 : num;
    }
  };

  // ============================================
  // 3. METADATA UTILITIES
  // ============================================
  const MetadataUtils = {
    extractMetadata(tripData) {
      if (!tripData) return {};
      
      const metadata = tripData.metadata || {};
      const overview = tripData.overview || {};
      const pricing = tripData.pricing || {};
      
      return {
        tripTitle: metadata.tripTitle || overview.tripTitle || '',
        clientName: metadata.clientName || '',
        startDate: metadata.startDate || overview.startDate || '',
        endDate: metadata.endDate || overview.endDate || '',
        guests: metadata.guests || overview.guests || 2,
        tripType: metadata.tripType || overview.tripType || '',
        destination: metadata.destination || overview.destination || '',
        grandTotal: pricing.grandTotal || PriceUtils.calculateGrandTotal(pricing),
        perPerson: pricing.perPerson || PriceUtils.calculatePricePerPerson(
          pricing.grandTotal, 
          metadata.guests || 2
        ),
        createdDate: metadata.createdDate || DateUtils.getCurrentTimestamp(),
        lastModified: metadata.lastModified || DateUtils.getCurrentTimestamp(),
        version: metadata.version || CONFIG.VERSION
      };
    },

    generateDisplayMetadata(tripData) {
      const metadata = this.extractMetadata(tripData);
      
      return {
        title: metadata.tripTitle,
        subtitle: this.generateSubtitle(metadata),
        dateRange: DateUtils.formatDateRange(metadata.startDate, metadata.endDate),
        priceFormatted: PriceUtils.formatPrice(metadata.grandTotal),
        pricePerPersonFormatted: PriceUtils.formatPrice(metadata.perPerson),
        nights: DateUtils.calculateNights(metadata.startDate, metadata.endDate),
        guests: metadata.guests,
        year: DateUtils.extractYear(metadata.startDate),
        tripType: metadata.tripType,
        destination: metadata.destination
      };
    },

    generateSubtitle(metadata) {
      const parts = [];
      
      if (metadata.destination) {
        parts.push(metadata.destination);
      }
      
      if (metadata.tripType) {
        parts.push(metadata.tripType);
      }
      
      if (metadata.guests) {
        parts.push(`${metadata.guests} guests`);
      }
      
      return parts.join(' \u2022 ');
    },

    validateMetadata(metadata) {
      const required = ['tripTitle', 'startDate', 'endDate', 'guests'];
      const missing = [];
      
      required.forEach(field => {
        if (!metadata[field]) {
          missing.push(field);
        }
      });
      
      return {
        valid: missing.length === 0,
        missing: missing
      };
    }
  };

  // ============================================
  // 4. LABEL UTILITIES
  // ============================================
  const LabelUtils = {
    generateBinName(year, clientName, tripType, optionNumber) {
      const cleanYear = year || new Date().getFullYear();
      const cleanClient = (clientName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '');
      const cleanType = (tripType || 'Trip').replace(/[^a-zA-Z0-9]/g, '');
      const cleanOption = optionNumber || 1;
      
      return `${cleanYear}-${cleanClient}-${cleanType}-Option${cleanOption}`;
    },

    parseBinName(binName) {
      if (!binName) return {};
      
      const parts = binName.split('-');
      
      return {
        year: parts[0] || '',
        clientName: parts[1] || '',
        tripType: parts[2] || '',
        optionNumber: parseInt((parts[3] || '').replace('Option', '')) || 1
      };
    },

    generateTripLabel(tripData) {
      const metadata = MetadataUtils.extractMetadata(tripData);
      
      if (metadata.tripTitle) {
        return metadata.tripTitle;
      }
      
      const parts = [];
      if (metadata.destination) parts.push(metadata.destination);
      if (metadata.tripType) parts.push(metadata.tripType);
      if (metadata.startDate) parts.push(DateUtils.extractYear(metadata.startDate));
      
      return parts.join(' - ') || 'Untitled Trip';
    }
  };

  // ============================================
  // 5. VALIDATION UTILITIES
  // ============================================
  const ValidationUtils = {
    validateTripData(tripData) {
      const errors = [];
      
      if (!tripData) {
        errors.push('No trip data provided');
        return { valid: false, errors };
      }
      
      if (!tripData.metadata) {
        errors.push('Missing metadata section');
      } else {
        const metadataValidation = MetadataUtils.validateMetadata(tripData.metadata);
        if (!metadataValidation.valid) {
          errors.push(`Missing metadata fields: ${metadataValidation.missing.join(', ')}`);
        }
      }
      
      if (!tripData.pricing) {
        errors.push('Missing pricing section');
      } else if (!tripData.pricing.grandTotal && tripData.pricing.grandTotal !== 0) {
        errors.push('Missing grand total in pricing');
      }
      
      if (tripData.metadata?.startDate && tripData.metadata?.endDate) {
        const start = new Date(tripData.metadata.startDate);
        const end = new Date(tripData.metadata.endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          errors.push('Invalid date format');
        } else if (end < start) {
          errors.push('End date is before start date');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors: errors
      };
    },

    isValidDate(dateString) {
      if (!dateString) return false;
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
      }
      
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    },

    isValidPrice(price) {
      if (price === null || price === undefined) return false;
      const num = Number(price);
      return !isNaN(num) && num >= 0;
    },

    isValidEmail(email) {
      if (!email) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  };

  // ============================================
  // 6. STORAGE UTILITIES (JSONBin)
  // ============================================
  const StorageUtils = {
    async loadMasterIndex(apiKey, indexId) {
      if (!apiKey || !indexId) {
        throw new Error('API key and index ID are required');
      }
      
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${indexId}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': apiKey,
            'X-Access-Key': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load master index: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.record || {};
      } catch (error) {
        console.error('Error loading master index:', error);
        throw error;
      }
    },

    async saveMasterIndex(indexData, apiKey, indexId) {
      if (!apiKey || !indexId) {
        throw new Error('API key and index ID are required');
      }
      
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${indexId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey,
            'X-Access-Key': apiKey
          },
          body: JSON.stringify(indexData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save master index: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error saving master index:', error);
        throw error;
      }
    },

    async loadBin(binId, apiKey) {
      if (!apiKey || !binId) {
        throw new Error('API key and bin ID are required');
      }
      
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': apiKey,
            'X-Access-Key': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load bin: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.record || {};
      } catch (error) {
        console.error('Error loading bin:', error);
        throw error;
      }
    },

    async createBin(data, apiKey, binName = null) {
      if (!apiKey) {
        throw new Error('API key is required');
      }
      
      try {
        const headers = {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey,
          'X-Access-Key': apiKey
        };
        
        if (binName) {
          headers['X-Bin-Name'] = binName;
        }
        
        const response = await fetch('https://api.jsonbin.io/v3/b', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create bin: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error creating bin:', error);
        throw error;
      }
    },

    async updateBin(binId, data, apiKey) {
      if (!apiKey || !binId) {
        throw new Error('API key and bin ID are required');
      }
      
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey,
            'X-Access-Key': apiKey
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update bin: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error updating bin:', error);
        throw error;
      }
    },

    async deleteBin(binId, apiKey) {
      if (!apiKey || !binId) {
        throw new Error('API key and bin ID are required');
      }
      
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'DELETE',
          headers: {
            'X-Master-Key': apiKey,
            'X-Access-Key': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete bin: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error deleting bin:', error);
        throw error;
      }
    },

    /**
     * Legacy unwrap helper: returns record.option if present, else record.
     * @param {Object} record
     * @returns {Object}
     */
    unwrapLegacy(record) {
      if (!record) return record;
      return record.option ? record.option : record;
    },

    /**
     * Add an entry to a master index collection.
     * @param {Object} indexData
     * @param {string} collection - 'options' | 'comparisons' | 'itineraries'
     * @param {Object} entry
     * @returns {Object} modified indexData
     */
    addToIndex(indexData, collection, entry) {
      if (!indexData) return indexData;
      if (!indexData[collection]) indexData[collection] = [];
      indexData[collection].push(entry);
      return indexData;
    },

    /**
     * Update an entry in a master index collection by id or binId.
     * @param {Object} indexData
     * @param {string} collection - 'options' | 'comparisons' | 'itineraries'
     * @param {string} id
     * @param {Object} updates
     * @returns {Object} modified indexData
     */
    updateInIndex(indexData, collection, id, updates) {
      if (!indexData || !indexData[collection] || !id) return indexData;
      const list = indexData[collection];
      const entry = list.find(e => e.id === id || e.binId === id);
      if (entry) {
        Object.assign(entry, updates);
      }
      return indexData;
    },

    /**
     * Remove an entry from a master index collection by id or binId.
     * @param {Object} indexData
     * @param {string} collection - 'options' | 'comparisons' | 'itineraries'
     * @param {string} id
     * @returns {Object} modified indexData
     */
    removeFromIndex(indexData, collection, id) {
      if (!indexData || !indexData[collection] || !id) return indexData;
      indexData[collection] = indexData[collection].filter(e => e.id !== id && e.binId !== id);
      return indexData;
    },

    /**
     * Find comparison entry by slug.
     * @param {Object} indexData
     * @param {string} slug
     * @returns {Object|null}
     */
    findBySlug(indexData, slug) {
      if (!indexData || !indexData.comparisons || !slug) return null;
      return indexData.comparisons.find(c => c.slug === slug) || null;
    }
  };

  // ============================================
  // 7. UI UTILITIES
  // ============================================
  const UIUtils = {
    _bannerCallbacks: {},

    showToast(message, type = 'info', duration = 3000) {
      // TRN-205: If embedded in iframe, post message to parent to render toast there
      if (window.self !== window.top) {
        window.parent.postMessage({
          type: 'FORGE_TOAST',
          payload: { message, type, duration }
        }, '*');
        return;
      }

      // Render toast locally (standalone mode)
      this._renderToast(message, type, duration);
    },

    // Internal method to render toast in current window
    _renderToast(message, type = 'info', duration = 3000) {
      let container = document.getElementById('forge-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'forge-toast-container';
        container.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
          align-items: center;
        `;
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');

      const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
      };

      const icons = {
        success: CONFIG.EMOJI.CHECK,
        error: CONFIG.EMOJI.ERROR,
        info: '\u{2139}\uFE0F',
        warning: CONFIG.EMOJI.WARNING
      };

      toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: forgeSlideDown 0.3s ease-out;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
      `;

      toast.innerHTML = `
        <span style="font-size: 20px;">${icons[type] || icons.info}</span>
        <span>${message}</span>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'forgeSlideUp 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    showSpinner(message = 'Loading...') {
      const spinner = document.createElement('div');
      spinner.id = 'forge-spinner';
      
      spinner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        flex-direction: column;
        gap: 16px;
      `;
      
      spinner.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: forgeSpin 1s linear infinite;
        "></div>
        <div style="color: white; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${message}
        </div>
      `;
      
      document.body.appendChild(spinner);
      return spinner;
    },

    hideSpinner() {
      const spinner = document.getElementById('forge-spinner');
      if (spinner) {
        spinner.remove();
      }
    },

    /**
     * Show confirmation dialog
     * @param {string} message - Message to display
     * @param {Object} options - Configuration options
     * @param {string} options.confirmText - Confirm button text (default: 'OK')
     * @param {string} options.cancelText - Cancel button text (default: 'Cancel')
     * @param {boolean} options.danger - Use danger styling (default: false)
     * @returns {Promise<boolean>} User's choice
     */
    showConfirm(message, options = {}) {
      // Support old signature: showConfirm(message, confirmText, cancelText)
      if (typeof options === 'string') {
        options = { confirmText: options, cancelText: arguments[2] || 'Cancel' };
      }
      
      const { 
        confirmText = 'OK', 
        cancelText = 'Cancel',
        danger = false 
      } = options;
      
      // Earth-tone palette colors
      const btnColor = danger ? '#C4756E' : '#3D3732'; // Terracotta for danger, Brown for normal
      
      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: forgeSlideUp 0.2s ease-out;
        `;
        
        modal.innerHTML = `
          <div style="
            background: white;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
            max-width: 400px;
            width: 90%;
            animation: forgeSlideUp 0.2s ease-out;
          ">
            <p style="
              margin: 0 0 24px 0;
              font-size: 16px;
              color: #374151;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.5;
            ">${message}</p>
            <div style="
              display: flex;
              gap: 12px;
              justify-content: flex-end;
            ">
              <button id="forge-confirm-cancel" style="
                padding: 10px 20px;
                border: 1px solid #d1d5db;
                background: white;
                color: #374151;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 500;
                transition: background 0.15s;
              ">${cancelText}</button>
              <button id="forge-confirm-ok" style="
                padding: 10px 20px;
                border: none;
                background: ${btnColor};
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 500;
                transition: opacity 0.15s;
              ">${confirmText}</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add hover effects
        const okBtn = modal.querySelector('#forge-confirm-ok');
        const cancelBtn = modal.querySelector('#forge-confirm-cancel');
        okBtn.addEventListener('mouseenter', () => okBtn.style.opacity = '0.9');
        okBtn.addEventListener('mouseleave', () => okBtn.style.opacity = '1');
        cancelBtn.addEventListener('mouseenter', () => cancelBtn.style.background = '#f3f4f6');
        cancelBtn.addEventListener('mouseleave', () => cancelBtn.style.background = 'white');
        
        const cleanup = () => {
          modal.remove();
        };
        
        okBtn.addEventListener('click', () => {
          cleanup();
          resolve(true);
        });
        
        cancelBtn.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });
        
        // Click outside to cancel
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            cleanup();
            resolve(false);
          }
        });
        
        // Allow ESC to cancel
        const escHandler = (e) => {
          if (e.key === 'Escape') {
            cleanup();
            resolve(false);
            document.removeEventListener('keydown', escHandler);
          }
        };
        document.addEventListener('keydown', escHandler);
        
        // Focus the cancel button for keyboard accessibility
        cancelBtn.focus();
      });
    },

    animateIn(element, animation = 'fadeIn') {
      const animations = {
        fadeIn: 'opacity 0.3s ease-in',
        slideIn: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        scaleIn: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out'
      };
      
      element.style.transition = animations[animation] || animations.fadeIn;
      
      switch (animation) {
        case 'fadeIn':
          element.style.opacity = '0';
          requestAnimationFrame(() => {
            element.style.opacity = '1';
          });
          break;
        
        case 'slideIn':
          element.style.opacity = '0';
          element.style.transform = 'translateY(20px)';
          requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          });
          break;
        
        case 'scaleIn':
          element.style.opacity = '0';
          element.style.transform = 'scale(0.8)';
          requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
          });
          break;
      }
    },

    // ==========================================
    // BANNER SYSTEM (v3.1.0)
    // ==========================================

    initBanners(options = {}) {
      this._bannerCallbacks = options;
      
      if (!document.getElementById('forge-banner-styles')) {
        const style = document.createElement('style');
        style.id = 'forge-banner-styles';
        style.textContent = `
          .forge-banner-admin,
          .forge-banner-preview {
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          
          .forge-banner-admin.hidden,
          .forge-banner-preview.hidden {
            display: none !important;
          }
          
          .forge-banner-admin {
            background: #83644D;
            color: white;
          }
          
          .forge-banner-preview {
            background: #fef3c7;
            border-bottom: 2px solid #fcd34d;
            color: #92400e;
          }
          
          .forge-banner-text {
            font-size: 1.125rem;
            font-weight: 700;
            letter-spacing: 0.025em;
          }
          
          .forge-banner-btn {
            padding: 0.5rem 1.25rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
          }
          
          .forge-banner-admin .forge-banner-btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
          }
          .forge-banner-admin .forge-banner-btn:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          .forge-banner-preview .forge-banner-btn {
            background: #d97706;
            color: white;
          }
          .forge-banner-preview .forge-banner-btn:hover {
            background: #b45309;
          }
          
          @media (max-width: 640px) {
            .forge-banner-admin,
            .forge-banner-preview {
              padding: 0.75rem 1rem;
            }
            .forge-banner-text {
              font-size: 1rem;
            }
            .forge-banner-btn {
              padding: 0.375rem 1rem;
              font-size: 0.8125rem;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      if (!document.getElementById('forgeBannerAdmin')) {
        const adminBanner = document.createElement('div');
        adminBanner.id = 'forgeBannerAdmin';
        adminBanner.className = 'forge-banner-admin hidden';
        adminBanner.innerHTML = `
          <span class="forge-banner-text">Admin Mode</span>
          <button class="forge-banner-btn" onclick="ForgeUtils.UI.setViewMode('preview')">
            Preview as Client
          </button>
        `;
        
        const previewBanner = document.createElement('div');
        previewBanner.id = 'forgeBannerPreview';
        previewBanner.className = 'forge-banner-preview hidden';
        previewBanner.innerHTML = `
          <span class="forge-banner-text">Client Preview Mode</span>
          <button class="forge-banner-btn" onclick="ForgeUtils.UI.setViewMode('admin')">
            Back to Admin
          </button>
        `;
        
        let container = null;
        let insertBeforeEl = null;
        
        if (options.insertInto) {
          container = document.querySelector(options.insertInto);
          if (container) {
            insertBeforeEl = container.firstChild;
          }
        }
        
        if (!container) {
          container = document.body;
          insertBeforeEl = document.body.firstChild;
        }
        
        container.insertBefore(previewBanner, insertBeforeEl);
        container.insertBefore(adminBanner, previewBanner);
      }
      
      console.log('%c\u{1F6A9} FORGE Banner System initialized', 'color: #83644D; font-weight: bold;');
    },

    setViewMode(mode) {
      if (!['admin', 'preview', 'client'].includes(mode)) {
        console.warn('Invalid view mode:', mode);
        return;
      }
      
      currentViewMode = mode;
      
      const adminBanner = document.getElementById('forgeBannerAdmin');
      const previewBanner = document.getElementById('forgeBannerPreview');
      
      if (!adminBanner || !previewBanner) {
        console.warn('Banners not initialized. Call initBanners() first.');
        return;
      }
      
      adminBanner.classList.add('hidden');
      previewBanner.classList.add('hidden');
      
      if (mode === 'admin') {
        adminBanner.classList.remove('hidden');
        if (this._bannerCallbacks?.onExitPreview) {
          this._bannerCallbacks.onExitPreview();
        }
      } else if (mode === 'preview') {
        previewBanner.classList.remove('hidden');
        if (this._bannerCallbacks?.onEnterPreview) {
          this._bannerCallbacks.onEnterPreview();
        }
      }
      
      console.log('%c\u{1F6A9} View mode:', 'color: #83644D;', mode);
    },

    getViewMode() {
      return currentViewMode;
    },

    isAdminMode() {
      return currentViewMode === 'admin';
    },

    isClientFacing() {
      return currentViewMode === 'preview' || currentViewMode === 'client';
    },

    // ==========================================
    // TOOLTIP SYSTEM (v3.2.17)
    // ==========================================

    /**
     * Initialize tooltips for icon-only buttons
     * Scans for buttons with only <i> or <svg> children and adds title attributes
     * @param {Object} options - Configuration options
     * @param {string} options.selector - CSS selector for buttons to scan (default: 'button')
     * @param {Object} options.mappings - Custom icon class to tooltip text mappings
     * @param {boolean} options.useOnclick - Also infer from onclick handler names (default: true)
     */
    initTooltips(options = {}) {
      const {
        selector = 'button',
        mappings = {},
        useOnclick = true
      } = options;

      // Default icon class to tooltip mappings
      const defaultMappings = {
        // Font Awesome style
        'fa-edit': 'Edit',
        'fa-pencil': 'Edit',
        'fa-trash': 'Delete',
        'fa-trash-alt': 'Delete',
        'fa-save': 'Save',
        'fa-floppy-disk': 'Save',
        'fa-plus': 'Add',
        'fa-minus': 'Remove',
        'fa-times': 'Close',
        'fa-xmark': 'Close',
        'fa-check': 'Confirm',
        'fa-copy': 'Copy',
        'fa-clone': 'Duplicate',
        'fa-eye': 'View',
        'fa-eye-slash': 'Hide',
        'fa-search': 'Search',
        'fa-magnifying-glass': 'Search',
        'fa-refresh': 'Refresh',
        'fa-arrows-rotate': 'Refresh',
        'fa-cog': 'Settings',
        'fa-gear': 'Settings',
        'fa-download': 'Download',
        'fa-upload': 'Upload',
        'fa-share': 'Share',
        'fa-link': 'Copy Link',
        'fa-external-link': 'Open',
        'fa-arrow-up-right-from-square': 'Open',
        'fa-chevron-up': 'Move Up',
        'fa-chevron-down': 'Move Down',
        'fa-chevron-left': 'Previous',
        'fa-chevron-right': 'Next',
        'fa-expand': 'Expand',
        'fa-compress': 'Collapse',
        'fa-info': 'Info',
        'fa-circle-info': 'Info',
        'fa-question': 'Help',
        'fa-circle-question': 'Help',
        // Lucide/Heroicons style (used in some tools)
        'lucide-edit': 'Edit',
        'lucide-trash': 'Delete',
        'lucide-save': 'Save',
        'lucide-plus': 'Add',
        'lucide-x': 'Close',
        'lucide-check': 'Confirm',
        'lucide-copy': 'Copy',
        'lucide-eye': 'View',
        'lucide-settings': 'Settings',
        ...mappings
      };

      // Handler name patterns to tooltip mappings
      const handlerPatterns = {
        'edit': 'Edit',
        'delete': 'Delete',
        'remove': 'Remove',
        'save': 'Save',
        'add': 'Add',
        'create': 'Create',
        'close': 'Close',
        'cancel': 'Cancel',
        'confirm': 'Confirm',
        'copy': 'Copy',
        'duplicate': 'Duplicate',
        'view': 'View',
        'preview': 'Preview',
        'refresh': 'Refresh',
        'reload': 'Reload',
        'toggle': 'Toggle',
        'expand': 'Expand',
        'collapse': 'Collapse',
        'upload': 'Upload',
        'download': 'Download',
        'share': 'Share',
        'moveUp': 'Move Up',
        'moveDown': 'Move Down'
      };

      const buttons = document.querySelectorAll(selector);
      let tooltipsAdded = 0;

      buttons.forEach(button => {
        // Skip if already has a title
        if (button.title) return;

        // Check if this is an icon-only button
        const children = Array.from(button.childNodes).filter(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.trim().length > 0;
          }
          return node.nodeType === Node.ELEMENT_NODE;
        });

        // Only process if button contains just icon element(s) and no text
        const hasTextContent = children.some(node =>
          node.nodeType === Node.TEXT_NODE ||
          (node.nodeType === Node.ELEMENT_NODE &&
           !['I', 'SVG', 'SPAN'].includes(node.tagName) &&
           node.textContent.trim().length > 0)
        );

        if (hasTextContent) return;

        const iconEl = button.querySelector('i, svg');
        if (!iconEl) return;

        let tooltip = null;

        // Try to find tooltip from icon class
        if (iconEl.tagName === 'I') {
          const classes = Array.from(iconEl.classList);
          for (const cls of classes) {
            if (defaultMappings[cls]) {
              tooltip = defaultMappings[cls];
              break;
            }
            // Check for partial matches (e.g., fa-solid fa-edit -> fa-edit)
            const shortClass = cls.replace(/^(fa-solid|fa-regular|fa-light|fa-thin|fa-duotone)\s*/, '');
            if (defaultMappings[shortClass]) {
              tooltip = defaultMappings[shortClass];
              break;
            }
          }
        }

        // Try to infer from onclick handler
        if (!tooltip && useOnclick) {
          const onclick = button.getAttribute('onclick') || '';
          for (const [pattern, text] of Object.entries(handlerPatterns)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(onclick)) {
              tooltip = text;
              break;
            }
          }
        }

        // Try to infer from aria-label
        if (!tooltip && button.getAttribute('aria-label')) {
          tooltip = button.getAttribute('aria-label');
        }

        // Try to infer from data-action attribute
        if (!tooltip && button.dataset.action) {
          const action = button.dataset.action;
          tooltip = action.charAt(0).toUpperCase() + action.slice(1).replace(/([A-Z])/g, ' $1');
        }

        if (tooltip) {
          button.title = tooltip;
          tooltipsAdded++;
        }
      });

      console.log(`%c\u{1F4AC} FORGE Tooltips: Added ${tooltipsAdded} tooltips`, 'color: #83644D;');
      return tooltipsAdded;
    },

    // ==========================================
    // LAST SAVED INDICATOR (v3.2.17)
    // ==========================================

    _lastSavedState: {
      timestamp: null,
      element: null,
      intervalId: null,
      unsaved: true
    },

    /**
     * Initialize the "Last saved" indicator
     * @param {Object} options - Configuration options
     * @param {string} options.containerSelector - CSS selector for container to insert into (default: '.forge-sticky-toolbar')
     * @param {string} options.position - Where to insert: 'start', 'end', 'before-save', 'after-save' (default: 'start')
     * @param {string} options.saveButtonSelector - CSS selector for save button (for 'before-save'/'after-save' positions)
     * @param {number} options.updateInterval - How often to update display in ms (default: 30000)
     * @param {string} options.unsavedText - Text to show when not saved (default: 'Not saved yet')
     * @param {Function} options.onInit - Callback after initialization
     */
    initLastSaved(options = {}) {
      const {
        containerSelector = '.forge-sticky-toolbar',
        position = 'start',
        saveButtonSelector = '[data-action="save"], button[onclick*="save" i], .save-btn',
        updateInterval = 30000,
        unsavedText = 'Not saved yet',
        onInit = null
      } = options;

      // Clean up any existing instance
      this._cleanupLastSaved();

      const container = document.querySelector(containerSelector);
      if (!container) {
        console.warn('[ForgeUtils] Last saved: Container not found:', containerSelector);
        return null;
      }

      // Create the indicator element
      const indicator = document.createElement('span');
      indicator.id = 'forge-last-saved';
      indicator.className = 'forge-last-saved';
      indicator.style.cssText = `
        font-size: 0.75rem;
        color: #6b7280;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 0.25rem;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      `;

      // Insert at the specified position
      let inserted = false;
      if (position === 'before-save' || position === 'after-save') {
        const saveBtn = container.querySelector(saveButtonSelector);
        if (saveBtn) {
          if (position === 'before-save') {
            saveBtn.parentNode.insertBefore(indicator, saveBtn);
          } else {
            saveBtn.parentNode.insertBefore(indicator, saveBtn.nextSibling);
          }
          inserted = true;
        }
      }

      if (!inserted) {
        if (position === 'end') {
          container.appendChild(indicator);
        } else {
          container.insertBefore(indicator, container.firstChild);
        }
      }

      // Store state
      this._lastSavedState = {
        timestamp: null,
        element: indicator,
        intervalId: null,
        unsaved: true,
        unsavedText
      };

      // Initial render
      this._updateLastSavedDisplay();

      // Set up auto-update interval
      this._lastSavedState.intervalId = setInterval(() => {
        this._updateLastSavedDisplay();
      }, updateInterval);

      console.log('%c\u{23F0} FORGE Last Saved indicator initialized', 'color: #83644D;');

      if (onInit) onInit(indicator);
      return indicator;
    },

    /**
     * Mark as saved - call this after a successful save
     * @param {Date|number|string} timestamp - When saved (default: now)
     */
    markSaved(timestamp = null) {
      if (!this._lastSavedState.element) {
        console.warn('[ForgeUtils] Last saved: Not initialized. Call initLastSaved() first.');
        return;
      }

      this._lastSavedState.timestamp = timestamp ? new Date(timestamp) : new Date();
      this._lastSavedState.unsaved = false;
      this._updateLastSavedDisplay();

      console.log('[ForgeUtils] Marked as saved at:', this._lastSavedState.timestamp);
    },

    /**
     * Mark as unsaved/dirty
     */
    markUnsaved() {
      if (!this._lastSavedState.element) return;

      this._lastSavedState.unsaved = true;
      this._updateLastSavedDisplay();
    },

    /**
     * Get the last saved timestamp
     * @returns {Date|null}
     */
    getLastSavedTime() {
      return this._lastSavedState.timestamp;
    },

    /**
     * Clean up the last saved indicator
     */
    _cleanupLastSaved() {
      if (this._lastSavedState.intervalId) {
        clearInterval(this._lastSavedState.intervalId);
      }
      if (this._lastSavedState.element) {
        this._lastSavedState.element.remove();
      }
      this._lastSavedState = {
        timestamp: null,
        element: null,
        intervalId: null,
        unsaved: true
      };
    },

    /**
     * Update the display of the last saved indicator
     * @private
     */
    _updateLastSavedDisplay() {
      const { element, timestamp, unsaved, unsavedText } = this._lastSavedState;
      if (!element) return;

      if (unsaved || !timestamp) {
        element.innerHTML = `<span style="color: #d97706;">\u{25CF}</span> ${unsavedText || 'Not saved yet'}`;
        element.style.color = '#92400e';
        element.style.background = 'rgba(254, 243, 199, 0.8)';
        return;
      }

      const now = new Date();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeText;
      if (seconds < 10) {
        timeText = 'just now';
      } else if (seconds < 60) {
        timeText = `${seconds}s ago`;
      } else if (minutes < 60) {
        timeText = minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
      } else if (hours < 24) {
        timeText = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
      } else {
        timeText = days === 1 ? '1 day ago' : `${days} days ago`;
      }

      element.innerHTML = `<span style="color: #10b981;">\u{25CF}</span> Saved ${timeText}`;
      element.style.color = '#6b7280';
      element.style.background = 'rgba(255, 255, 255, 0.7)';
    },

    // ==========================================
    // LOADING/ERROR STATE HELPERS (v3.2.23)
    // ==========================================

    /**
     * Show full-page loading state
     * Assumes #loadingState and #errorState elements exist
     * @param {string} message - Loading message (default: 'Loading...')
     */
    showFullPageLoading(message = 'Loading...') {
      const loadingState = document.getElementById('loadingState');
      const errorState = document.getElementById('errorState');
      
      if (loadingState) {
        // Update message if there's a text element
        const textEl = loadingState.querySelector('p');
        if (textEl) {
          textEl.textContent = message;
        }
        loadingState.classList.remove('hidden');
      }
      
      if (errorState) {
        errorState.classList.add('hidden');
      }
    },

    /**
     * Hide full-page loading state
     */
    hideFullPageLoading() {
      const loadingState = document.getElementById('loadingState');
      if (loadingState) {
        loadingState.classList.add('hidden');
      }
    },

    /**
     * Show full-page error state
     * Assumes #loadingState, #errorState, and #errorMessage elements exist
     * @param {string} message - Error message
     * @param {string} backUrl - URL for back button (default: '/admin')
     * @param {string} backLabel - Label for back button (default: 'Back to Admin')
     */
    showFullPageError(message, backUrl = '/admin', backLabel = 'Back to Admin') {
      const loadingState = document.getElementById('loadingState');
      const errorState = document.getElementById('errorState');
      const errorMessage = document.getElementById('errorMessage');
      const backLink = errorState?.querySelector('a[href]');
      
      if (loadingState) {
        loadingState.classList.add('hidden');
      }
      
      if (errorState) {
        errorState.classList.remove('hidden');
      }
      
      if (errorMessage) {
        errorMessage.textContent = message;
      }
      
      if (backLink) {
        backLink.href = backUrl;
        backLink.textContent = backLabel;
      }
    },

    /**
     * Show overlay loading state (auto-injects HTML if needed)
     * @param {string} message - Loading message (default: 'Loading...')
     */
    showOverlayLoading(message = 'Loading...') {
      let overlay = document.getElementById('forgeLoadingOverlay');
      
      if (!overlay) {
        // Inject HTML if it doesn't exist
        overlay = document.createElement('div');
        overlay.id = 'forgeLoadingOverlay';
        overlay.className = 'forge-loading-overlay hidden';
        overlay.innerHTML = `
          <div class="bg-white rounded-lg p-8 shadow-2xl text-center">
            <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span id="forgeLoadingText">Loading...</span>
          </div>
        `;
        document.body.appendChild(overlay);
      }
      
      // Update message
      const textEl = document.getElementById('forgeLoadingText');
      if (textEl) {
        textEl.textContent = message;
      }
      
      // Show overlay
      overlay.classList.remove('hidden');
    },

    /**
     * Hide overlay loading state
     */
    hideOverlayLoading() {
      const overlay = document.getElementById('forgeLoadingOverlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
    },

    /**
     * Show inline loading state (for admin tabs)
     * @param {string} elementId - ID of element to show
     */
    showInlineLoading(elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.remove('hidden');
      }
    },

    /**
     * Hide inline loading state
     * @param {string} elementId - ID of element to hide
     */
    hideInlineLoading(elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.add('hidden');
      }
    },

    /**
     * Show inline empty state
     * @param {string} elementId - ID of element to show
     */
    showInlineEmpty(elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.remove('hidden');
      }
    },

    /**
     * Hide inline empty state
     * @param {string} elementId - ID of element to hide
     */
    hideInlineEmpty(elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.add('hidden');
      }
    },

    // ==========================================
    // STICKY TOOLBAR HELPERS (v3.2.26)
    // ==========================================

    /**
     * Update toolbar save button state
     * @param {boolean} saved - true if saved, false if unsaved
     */
    setToolbarSaveState(saved) {
      const btn = document.getElementById('toolbarSaveBtn');
      const text = document.getElementById('toolbarSaveBtnText');
      const revertBtn = document.getElementById('toolbarRevertBtn');
      
      if (btn) {
        btn.disabled = saved;
      }
      if (text) {
        text.textContent = saved ? 'Saved' : 'Save';
      }
      if (revertBtn) {
        revertBtn.disabled = saved;
      }
    },

    /**
     * Initialize sticky toolbar (adds padding class to body)
     */
    initStickyToolbar() {
      document.body.classList.add('has-sticky-toolbar');
    }
  };

  // ============================================
  // 8. DATA MIGRATION UTILITIES
  // ============================================
  const MigrationUtils = {
    migrateToV3(oldData) {
      if (oldData.metadata?.version && oldData.metadata.version >= '3.0.0') {
        return oldData;
      }
      
      const migrated = {
        metadata: this.migrateMetadata(oldData),
        overview: oldData.overview || {},
        pricing: this.migratePricing(oldData),
        flights: oldData.flights || [],
        hotels: this.migrateHotels(oldData),
        cruise: oldData.cruise || null,
        preTrip: oldData.preTrip || null,
        postTrip: oldData.postTrip || null,
        displayMetadata: this.migrateDisplayMetadata(oldData)
      };
      
      return migrated;
    },

    migrateMetadata(oldData) {
      const metadata = oldData.metadata || {};
      
      return {
        tripTitle: metadata.tripTitle || oldData.title || '',
        clientName: metadata.clientName || '',
        startDate: metadata.startDate || '',
        endDate: metadata.endDate || '',
        guests: metadata.guests || 2,
        createdDate: metadata.createdDate || DateUtils.getCurrentTimestamp(),
        lastModified: DateUtils.getCurrentTimestamp(),
        version: CONFIG.VERSION,
        tripType: metadata.tripType || oldData.overview?.tripType || '',
        destination: metadata.destination || ''
      };
    },

    migratePricing(oldData) {
      const pricing = oldData.pricing || {};
      
      let grandTotal = pricing.grandTotal;
      if (!grandTotal) {
        grandTotal = PriceUtils.calculateGrandTotal(pricing);
      }
      
      return {
        packageTotal: pricing.packageTotal || 0,
        flightsTotal: pricing.flightsTotal || 0,
        prePostHotelsTotal: pricing.prePostHotelsTotal || 0,
        additionalCosts: pricing.additionalCosts || 0,
        grandTotal: grandTotal,
        perPerson: pricing.perPerson || PriceUtils.calculatePricePerPerson(
          grandTotal, 
          oldData.metadata?.guests || 2
        )
      };
    },

    migrateHotels(oldData) {
      if (!oldData.hotels || !Array.isArray(oldData.hotels)) {
        return [];
      }
      
      return oldData.hotels.map(hotel => ({
        ...hotel,
        roomType: hotel.roomType || hotel.room || '',
        amenities: hotel.amenities || []
      }));
    },

    migrateDisplayMetadata(oldData) {
      if (oldData.displayMetadata) {
        return oldData.displayMetadata;
      }
      
      return MetadataUtils.generateDisplayMetadata(oldData);
    },

    batchMigrate(options) {
      if (!Array.isArray(options)) {
        return [];
      }
      
      return options.map(option => this.migrateToV3(option));
    }
  };

  // ============================================
  // 9. DATA NORMALIZATION UTILITIES (TRN-215)
  // ============================================
  const DataUtils = {
    /**
     * Normalize flights array to canonical nested segments[] format
     * Handles both nested (ForgeBuilder) and flat (legacy) formats
     * @param {Array} flights - Array of flight objects
     * @returns {Array} - Normalized flights with segments[] structure
     */
    normalizeFlights(flights) {
      if (!flights || !Array.isArray(flights)) {
        return [];
      }

      return flights.map(flight => {
        // Already in nested format with segments - return as-is
        if (flight.segments && Array.isArray(flight.segments) && flight.segments.length > 0) {
          return flight;
        }

        // Flat format - convert to nested segments[]
        if (flight.from || flight.to || flight.departAirport || flight.arriveAirport) {
          return {
            type: flight.type || 'outbound',
            segments: [{
              departure: flight.from || flight.departAirport || '',
              arrival: flight.to || flight.arriveAirport || '',
              date: flight.date || '',
              departTime: flight.departTime || flight.time || '',
              arriveTime: flight.arriveTime || '',
              airline: flight.airline || '',
              flightNumber: flight.flightNumber || ''
            }],
            notes: flight.notes || '',
            arrivesNextDay: flight.arrivesNextDay || false
          };
        }

        // Unknown format - return as-is with empty segments
        console.warn('Unknown flight format:', flight);
        return {
          ...flight,
          segments: flight.segments || []
        };
      });
    },

    /**
     * Get summary string for a flight (all segments)
     * Example: "CLT → DFW → LAS" or "CLT → LAS"
     * @param {Object} flight - Flight object with segments[]
     * @returns {string} - Route summary
     */
    getFlightRouteSummary(flight) {
      if (!flight) return '';

      const segments = flight.segments || [];
      if (segments.length === 0) {
        // Fallback to flat fields
        if (flight.from && flight.to) {
          return `${flight.from} \u2192 ${flight.to}`;
        }
        return '';
      }

      // Build route from segments: first departure + all arrivals
      const route = [segments[0].departure];
      segments.forEach(seg => {
        if (seg.arrival) route.push(seg.arrival);
      });

      return route.join(' \u2192 ');
    },

    /**
     * Calculate total layover time for multi-segment flight
     * @param {Object} flight - Flight object with segments[]
     * @returns {number} - Total layover minutes (0 if single segment)
     */
    calculateLayoverTime(flight) {
      if (!flight || !flight.segments || flight.segments.length < 2) {
        return 0;
      }

      let totalLayover = 0;
      for (let i = 0; i < flight.segments.length - 1; i++) {
        const currentSeg = flight.segments[i];
        const nextSeg = flight.segments[i + 1];

        if (currentSeg.arriveTime && nextSeg.departTime) {
          const arriveMinutes = this._timeToMinutes(currentSeg.arriveTime);
          const departMinutes = this._timeToMinutes(nextSeg.departTime);

          if (arriveMinutes !== null && departMinutes !== null) {
            let layover = departMinutes - arriveMinutes;
            // Handle overnight layover
            if (layover < 0) layover += 24 * 60;
            totalLayover += layover;
          }
        }
      }

      return totalLayover;
    },

    /**
     * Format layover time as human-readable string
     * @param {number} minutes - Layover time in minutes
     * @returns {string} - Formatted string like "1h 30m"
     */
    formatLayoverTime(minutes) {
      if (!minutes || minutes <= 0) return '';

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    },

    /**
     * Convert HH:MM time string to minutes since midnight
     * @private
     */
    _timeToMinutes(timeStr) {
      if (!timeStr) return null;
      const parts = timeStr.split(':');
      if (parts.length < 2) return null;
      const hours = parseInt(parts[0], 10);
      const mins = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(mins)) return null;
      return hours * 60 + mins;
    },

    /**
     * Parse a value that may be a number, string with currency symbols, or formatted with commas
     * @param {any} value - Value to parse (number, string like "$5,000", or null/undefined)
     * @returns {number} - Parsed number, or 0 if invalid
     */
    parseNumericValue(value) {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'number') return value;
      // Remove currency symbols and commas
      const cleaned = String(value).replace(/[$,]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
  };

  // ============================================
  // PDF UTILITIES (Cloudflare worker)
  // ============================================
  const PdfUtils = {
    WORKER_URL: 'https://trnt-pdf.damon-be2.workers.dev',

    /**
     * Generate a PDF via worker and return the blob.
     * @param {Object} options
     * @param {string} options.url - Page URL to render (defaults to current page).
     * @param {string} options.filename - Desired filename (with .pdf).
     * @param {string} options.headerText - Optional header text.
     * @param {string} options.footerText - Optional footer text.
     * @param {Function} options.onStart - Called before fetch.
     * @param {Function} options.onComplete - Called with (blob, filename) on success.
     * @param {Function} options.onError - Called with (error) on failure.
     * @returns {Promise<Blob>}
     */
    async download(options = {}) {
      const {
        url = (typeof window !== 'undefined' ? window.location.href : ''),
        filename = 'download.pdf',
        headerText = '',
        footerText = '',
        onStart,
        onComplete,
        onError
      } = options;

      try {
        onStart?.();

        const params = new URLSearchParams({
          url,
          filename,
          headerText,
          footerText
        });

        const response = await fetch(`${this.WORKER_URL}?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`PDF generation failed (${response.status})`);
        }

        const blob = await response.blob();
        onComplete?.(blob, filename);
        return blob;
      } catch (error) {
        onError?.(error);
        throw error;
      }
    }
  };

  // ============================================
  // ADD ANIMATIONS TO DOM
  // ============================================
  const addAnimations = () => {
    if (document.getElementById('forge-animations')) return;
    
    const style = document.createElement('style');
    style.id = 'forge-animations';
    style.textContent = `
      @keyframes forgeSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes forgeSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      @keyframes forgeSlideUp {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-100%);
          opacity: 0;
        }
      }

      @keyframes forgeSlideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes forgeSpin {
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAnimations);
  } else {
    addAnimations();
  }

  // ============================================
  // PUBLIC API
  // ============================================
  return {
    CONFIG,
    Date: DateUtils,
    Price: PriceUtils,
    Metadata: MetadataUtils,
    Label: LabelUtils,
    Validation: ValidationUtils,
    Storage: StorageUtils,
    UI: UIUtils,
    Migration: MigrationUtils,
    Data: DataUtils,
    Pdf: PdfUtils,
    version: CONFIG.VERSION
  };
})();

window.ForgeUtils = ForgeUtils;

// ============================================
// CONFIGURATION (TRN-220)
// ============================================
ForgeUtils.CONFIG = {
  jsonbin: {
    apiKey: '$2a$10$UNwYVv4XjFwr/sJ8BTilOu9TQME4u/zAa4P1TvcEuckVvdlUvd63C',
    masterIndex: '6914fec0ae596e708f556374'
  },
  workers: {
    ai: 'https://trnt-ai-proxy.damon-be2.workers.dev/v1/messages',
    places: 'https://trnt-places.damon-be2.workers.dev',
    unsplash: 'https://trnt-unsplash.damon-be2.workers.dev',
    formspree: 'https://formspree.io/f/mqawkrzw'
  },
  urls: {
    base: 'https://forgetravel.co'
  }
};

console.log(`%c\u{1F525} FORGE v${ForgeUtils.version} Loaded`, 
  'color: #83644D; font-weight: bold; font-size: 14px;');
