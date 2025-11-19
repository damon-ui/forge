/**
 * FORGE - JavaScript Utility Library
 * Version: 3.0.0
 * Date: November 19, 2025
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
 * 7. UI Helpers
 * 8. Data Migration
 */

const ForgeUtils = (function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    VERSION: '3.0.0',
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
  // 1. DATE UTILITIES
  // ============================================
  const DateUtils = {
    /**
     * Format ISO date to display format
     * @param {string} isoDate - ISO format date (YYYY-MM-DD)
     * @param {string} format - Output format ('MM/DD/YYYY', 'MMM DD, YYYY', etc)
     * @returns {string} Formatted date
     */
    formatDate(isoDate, format = 'MM/DD/YYYY') {
      if (!isoDate) return '';
      
      try {
        const date = new Date(isoDate + 'T00:00:00'); // Force UTC interpretation
        if (isNaN(date.getTime())) return isoDate;
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const month = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        
        // Format patterns
        const patterns = {
          'MM/DD/YYYY': `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`,
          'MMM DD, YYYY': `${months[month]} ${day}, ${year}`,
          'MMMM DD, YYYY': `${monthsFull[month]} ${day}, ${year}`,
          'MMM DD': `${months[month]} ${day}`,
          'YYYY-MM-DD': isoDate // ISO format
        };
        
        return patterns[format] || patterns['MM/DD/YYYY'];
      } catch (error) {
        console.error('Date formatting error:', error);
        return isoDate;
      }
    },

    /**
     * Parse any date format to ISO (YYYY-MM-DD)
     * @param {string} dateString - Date in any common format
     * @returns {string} ISO format date
     */
    parseDate(dateString) {
      if (!dateString) return '';
      
      // Already ISO format
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

    /**
     * Format date range for display
     * @param {string} startDate - ISO start date
     * @param {string} endDate - ISO end date
     * @returns {string} Formatted range (e.g., "Jun 15-27, 2026")
     */
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
        
        // Same month and year
        if (startMonth === endMonth && startYear === endYear) {
          return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
        }
        
        // Different months, same year
        if (startYear === endYear) {
          return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
        }
        
        // Different years
        return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
      } catch (error) {
        console.error('Date range formatting error:', error);
        return `${startDate} - ${endDate}`;
      }
    },

    /**
     * Calculate duration in nights
     * @param {string} startDate - ISO start date
     * @param {string} endDate - ISO end date
     * @returns {number} Number of nights
     */
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

    /**
     * Get current timestamp in ISO format
     * @returns {string} Current ISO timestamp
     */
    getCurrentTimestamp() {
      return new Date().toISOString();
    },

    /**
     * Extract year from date string
     * @param {string} dateString - Date in any format
     * @returns {string} Year (YYYY)
     */
    extractYear(dateString) {
      if (!dateString) return '';
      
      try {
        // Check if already ISO format
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
    /**
     * Format price for display
     * @param {number} amount - Dollar amount
     * @param {boolean} includeCents - Include cents (default: false)
     * @returns {string} Formatted price
     */
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

    /**
     * Calculate price per person
     * @param {number} total - Total price
     * @param {number} guests - Number of guests
     * @returns {number} Price per person (rounded)
     */
    calculatePricePerPerson(total, guests) {
      if (!total || !guests || guests === 0) return 0;
      return Math.round(Number(total) / Number(guests));
    },

    /**
     * Calculate grand total from pricing object
     * @param {Object} pricing - Pricing object
     * @returns {number} Grand total
     */
    calculateGrandTotal(pricing) {
      if (!pricing) return 0;
      
      let total = 0;
      
      // Add package total
      if (pricing.packageTotal) {
        total += Number(pricing.packageTotal);
      }
      
      // Add flights
      if (pricing.flightsTotal) {
        total += Number(pricing.flightsTotal);
      }
      
      // Add pre/post hotels
      if (pricing.prePostHotelsTotal) {
        total += Number(pricing.prePostHotelsTotal);
      }
      
      // Add additional costs
      if (pricing.additionalCosts) {
        total += Number(pricing.additionalCosts);
      }
      
      return total;
    },

    /**
     * Parse price string to number
     * @param {string} priceString - Price string (e.g., "$1,234.56")
     * @returns {number} Numeric value
     */
    parsePrice(priceString) {
      if (!priceString) return 0;
      
      // Remove currency symbols, commas, spaces
      const cleaned = String(priceString).replace(/[$,\s]/g, '');
      const num = parseFloat(cleaned);
      
      return isNaN(num) ? 0 : num;
    }
  };

  // ============================================
  // 3. METADATA UTILITIES
  // ============================================
  const MetadataUtils = {
    /**
     * Extract metadata from trip data
     * @param {Object} tripData - Complete trip data object
     * @returns {Object} Extracted metadata
     */
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

    /**
     * Generate display metadata for library cards
     * @param {Object} tripData - Trip data
     * @returns {Object} Display-ready metadata
     */
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

    /**
     * Generate subtitle from metadata
     * @param {Object} metadata - Metadata object
     * @returns {string} Formatted subtitle
     */
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
      
      return parts.join(' • ');
    },

    /**
     * Validate required metadata fields
     * @param {Object} metadata - Metadata object
     * @returns {Object} Validation result {valid: boolean, missing: string[]}
     */
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
    /**
     * Generate standardized bin name
     * @param {string} year - Trip year (YYYY)
     * @param {string} clientName - Client name
     * @param {string} tripType - Trip type
     * @param {number} optionNumber - Option number
     * @returns {string} Formatted bin name
     */
    generateBinName(year, clientName, tripType, optionNumber) {
      // Clean and format inputs
      const cleanYear = year || new Date().getFullYear();
      const cleanClient = (clientName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '');
      const cleanType = (tripType || 'Trip').replace(/[^a-zA-Z0-9]/g, '');
      const cleanOption = optionNumber || 1;
      
      return `${cleanYear}-${cleanClient}-${cleanType}-Option${cleanOption}`;
    },

    /**
     * Parse bin name into components
     * @param {string} binName - Bin name to parse
     * @returns {Object} Parsed components
     */
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

    /**
     * Generate trip label for display
     * @param {Object} tripData - Trip data
     * @returns {string} Display label
     */
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
    /**
     * Validate trip data structure
     * @param {Object} tripData - Trip data to validate
     * @returns {Object} Validation result {valid: boolean, errors: string[]}
     */
    validateTripData(tripData) {
      const errors = [];
      
      if (!tripData) {
        errors.push('No trip data provided');
        return { valid: false, errors };
      }
      
      // Check metadata
      if (!tripData.metadata) {
        errors.push('Missing metadata section');
      } else {
        const metadataValidation = MetadataUtils.validateMetadata(tripData.metadata);
        if (!metadataValidation.valid) {
          errors.push(`Missing metadata fields: ${metadataValidation.missing.join(', ')}`);
        }
      }
      
      // Check pricing
      if (!tripData.pricing) {
        errors.push('Missing pricing section');
      } else if (!tripData.pricing.grandTotal && tripData.pricing.grandTotal !== 0) {
        errors.push('Missing grand total in pricing');
      }
      
      // Check dates are valid
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

    /**
     * Validate date format (YYYY-MM-DD)
     * @param {string} dateString - Date to validate
     * @returns {boolean} Is valid
     */
    isValidDate(dateString) {
      if (!dateString) return false;
      
      // Check format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
      }
      
      // Check if parseable
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    },

    /**
     * Validate price value
     * @param {*} price - Price to validate
     * @returns {boolean} Is valid
     */
    isValidPrice(price) {
      if (price === null || price === undefined) return false;
      const num = Number(price);
      return !isNaN(num) && num >= 0;
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid
     */
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
    /**
     * Load master index from JSONBin
     * @param {string} apiKey - JSONBin API key
     * @param {string} indexId - Master index bin ID
     * @returns {Promise<Object>} Master index data
     */
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

    /**
     * Save master index to JSONBin
     * @param {Object} indexData - Index data to save
     * @param {string} apiKey - JSONBin API key
     * @param {string} indexId - Master index bin ID
     * @returns {Promise<Object>} Response from JSONBin
     */
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

    /**
     * Load individual bin data
     * @param {string} binId - Bin ID to load
     * @param {string} apiKey - JSONBin API key
     * @returns {Promise<Object>} Bin data
     */
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

    /**
     * Create new bin
     * @param {Object} data - Data to save
     * @param {string} apiKey - JSONBin API key
     * @param {string} binName - Optional bin name
     * @returns {Promise<Object>} Response with new bin ID
     */
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

    /**
     * Update existing bin
     * @param {string} binId - Bin ID to update
     * @param {Object} data - New data
     * @param {string} apiKey - JSONBin API key
     * @returns {Promise<Object>} Response from JSONBin
     */
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

    /**
     * Delete bin
     * @param {string} binId - Bin ID to delete
     * @param {string} apiKey - JSONBin API key
     * @returns {Promise<Object>} Response from JSONBin
     */
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
    }
  };

  // ============================================
  // 7. UI UTILITIES
  // ============================================
  const UIUtils = {
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in ms (default: 3000)
     */
    showToast(message, type = 'info', duration = 3000) {
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
        info: 'ℹ️',
        warning: CONFIG.EMOJI.WARNING
      };
      
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      
      toast.innerHTML = `
        <span style="font-size: 20px;">${icons[type] || icons.info}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    /**
     * Show loading spinner
     * @param {string} message - Optional loading message
     * @returns {HTMLElement} Spinner element (call .remove() to hide)
     */
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
          animation: spin 1s linear infinite;
        "></div>
        <div style="color: white; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${message}
        </div>
      `;
      
      document.body.appendChild(spinner);
      return spinner;
    },

    /**
     * Hide loading spinner
     */
    hideSpinner() {
      const spinner = document.getElementById('forge-spinner');
      if (spinner) {
        spinner.remove();
      }
    },

    /**
     * Show confirmation dialog
     * @param {string} message - Message to display
     * @param {string} confirmText - Confirm button text (default: 'OK')
     * @param {string} cancelText - Cancel button text (default: 'Cancel')
     * @returns {Promise<boolean>} User's choice
     */
    showConfirm(message, confirmText = 'OK', cancelText = 'Cancel') {
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
        `;
        
        modal.innerHTML = `
          <div style="
            background: white;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
            max-width: 400px;
            width: 90%;
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
              ">${cancelText}</button>
              <button id="forge-confirm-ok" style="
                padding: 10px 20px;
                border: none;
                background: #3b82f6;
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 500;
              ">${confirmText}</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const cleanup = () => {
          modal.remove();
        };
        
        document.getElementById('forge-confirm-ok').addEventListener('click', () => {
          cleanup();
          resolve(true);
        });
        
        document.getElementById('forge-confirm-cancel').addEventListener('click', () => {
          cleanup();
          resolve(false);
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
      });
    },

    /**
     * Animate element entrance
     * @param {HTMLElement} element - Element to animate
     * @param {string} animation - Animation type: 'fadeIn', 'slideIn', 'scaleIn'
     */
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
    }
  };

  // ============================================
  // 8. DATA MIGRATION UTILITIES
  // ============================================
  const MigrationUtils = {
    /**
     * Migrate old format to v3.0 unified format
     * @param {Object} oldData - Data in old format
     * @returns {Object} Data in v3.0 format
     */
    migrateToV3(oldData) {
      // If already v3.0, return as-is
      if (oldData.metadata?.version === CONFIG.VERSION) {
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

    /**
     * Migrate metadata section
     * @param {Object} oldData - Old data
     * @returns {Object} Migrated metadata
     */
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

    /**
     * Migrate pricing section
     * @param {Object} oldData - Old data
     * @returns {Object} Migrated pricing
     */
    migratePricing(oldData) {
      const pricing = oldData.pricing || {};
      
      // Calculate grand total if missing
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

    /**
     * Migrate hotels section
     * @param {Object} oldData - Old data
     * @returns {Array} Migrated hotels
     */
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

    /**
     * Migrate display metadata
     * @param {Object} oldData - Old data
     * @returns {Object} Display metadata
     */
    migrateDisplayMetadata(oldData) {
      // If already exists, use it
      if (oldData.displayMetadata) {
        return oldData.displayMetadata;
      }
      
      // Generate from old data
      return MetadataUtils.generateDisplayMetadata(oldData);
    },

    /**
     * Batch migrate multiple trip options
     * @param {Array} options - Array of trip options
     * @returns {Array} Migrated options
     */
    batchMigrate(options) {
      if (!Array.isArray(options)) {
        return [];
      }
      
      return options.map(option => this.migrateToV3(option));
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
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
  };

  // Initialize animations when DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAnimations);
  } else {
    addAnimations();
  }

  // ============================================
  // PUBLIC API
  // ============================================
  return {
    // Configuration
    CONFIG,
    
    // Utility modules
    Date: DateUtils,
    Price: PriceUtils,
    Metadata: MetadataUtils,
    Label: LabelUtils,
    Validation: ValidationUtils,
    Storage: StorageUtils,
    UI: UIUtils,
    Migration: MigrationUtils,
    
    // Version
    version: CONFIG.VERSION
  };
})();

// Make available globally
window.ForgeUtils = ForgeUtils;

// Console message
console.log(`%c🔥 FORGE v${ForgeUtils.version} Loaded`, 
  'color: #3b82f6; font-weight: bold; font-size: 14px;');
