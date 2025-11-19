/**
 * TRNT Travel Tools - Unified Utilities Library
 * Version: 3.0.0
 * Date: November 18, 2025
 * 
 * This library provides standardized utilities for all TRNT tools.
 * Include this file in ALL tools before any tool-specific JavaScript.
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
    JSONBIN_API_KEY: '$2a$10$UNwYVv4XjFwr/sJ8BTilOu9TQME4u/zAa4P1TvcEuckVvdlUvd63C',
    JSONBIN_BASE_URL: 'https://api.jsonbin.io/v3',
    MASTER_INDEX_ID: '6914fec0ae596e708f556374',
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
      
      // Add any additional costs
      if (pricing.additionalCosts) {
        total += Number(pricing.additionalCosts);
      }
      
      return total;
    },

    /**
     * Parse price string to number
     * @param {string} priceString - Price string (e.g., "$1,234")
     * @returns {number} Numeric value
     */
    parsePrice(priceString) {
      if (!priceString) return 0;
      
      // Remove $ and commas, parse to number
      const cleaned = String(priceString).replace(/[$,]/g, '');
      const num = parseFloat(cleaned);
      
      return isNaN(num) ? 0 : num;
    }
  };

  // ============================================
  // 3. METADATA GENERATION
  // ============================================
  const MetadataUtils = {
    /**
     * Extract client last name
     * @param {string} clientName - Full client name
     * @returns {string} Last name
     */
    extractClientLastName(clientName) {
      if (!clientName) return '';
      
      // Handle "First and First Last" format
      const parts = clientName.trim().split(/\s+/);
      return parts[parts.length - 1] || '';
    },

    /**
     * Generate metadata object for new trip option
     * @param {Object} data - Trip data
     * @returns {Object} Complete metadata object
     */
    generateMetadata(data) {
      const now = DateUtils.getCurrentTimestamp();
      
      return {
        tripTitle: data.tripTitle || '',
        clientName: data.clientName || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        guests: data.guests || 2,
        createdDate: now,
        lastModified: now,
        version: CONFIG.VERSION,
        tripType: data.tripType || '',
        destination: data.destination || ''
      };
    },

    /**
     * Generate display metadata for comparison tool
     * @param {Object} data - Trip data
     * @returns {Object} Display metadata
     */
    generateDisplayMetadata(data) {
      return {
        title: this.generateTitle(data),
        subtitle: this.generateSubtitle(data),
        label: '', // Will be set by label generation
        dates: {
          display: DateUtils.formatDateRange(data.metadata?.startDate, data.metadata?.endDate),
          start: data.metadata?.startDate || '',
          end: data.metadata?.endDate || ''
        }
      };
    },

    /**
     * Generate option title from data
     * @param {Object} data - Trip data
     * @returns {string} Generated title
     */
    generateTitle(data) {
      // Priority: cruise name > trip title > destination
      if (data.cruise?.cruiseLine && data.cruise?.shipName) {
        return `${data.cruise.cruiseLine} ${data.cruise.shipName}`;
      }
      
      if (data.metadata?.tripTitle) {
        return data.metadata.tripTitle;
      }
      
      if (data.metadata?.destination) {
        return data.metadata.destination;
      }
      
      return 'Untitled Trip';
    },

    /**
     * Generate option subtitle from data
     * @param {Object} data - Trip data
     * @returns {string} Generated subtitle
     */
    generateSubtitle(data) {
      const parts = [];
      
      // Add cabin/room type
      if (data.cruise?.cabinCategory) {
        parts.push(data.cruise.cabinCategory);
      } else if (data.hotels?.[0]?.roomType) {
        parts.push(data.hotels[0].roomType);
      }
      
      // Add dates
      if (data.metadata?.startDate && data.metadata?.endDate) {
        parts.push(DateUtils.formatDateRange(data.metadata.startDate, data.metadata.endDate));
      }
      
      return parts.join(' · ') || '';
    },

    /**
     * Generate shareable URL slug
     * @param {Object} data - Trip data
     * @returns {string} URL slug
     */
    generateShareableURL(data) {
      const year = DateUtils.extractYear(data.metadata?.startDate);
      const lastName = this.extractClientLastName(data.metadata?.clientName);
      const tripType = data.overview?.tripType || data.metadata?.tripType || 'trip';
      
      const slug = `${year}-${lastName}-${tripType}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      return slug;
    },

    /**
     * Generate filename for downloads
     * @param {Object} data - Trip data
     * @param {string} extension - File extension (default: 'pdf')
     * @returns {string} Filename
     */
    generateFileName(data, extension = 'pdf') {
      const clientName = (data.metadata?.clientName || 'Client')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
      
      const tripTitle = (data.metadata?.tripTitle || 'Trip')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      
      const year = DateUtils.extractYear(data.metadata?.startDate) || 'YYYY';
      
      return `${clientName}_${tripTitle}_${year}.${extension}`;
    },

    /**
     * Update lastModified timestamp
     * @param {Object} data - Data object to update
     * @returns {Object} Updated data
     */
    updateLastModified(data) {
      if (!data.metadata) {
        data.metadata = {};
      }
      data.metadata.lastModified = DateUtils.getCurrentTimestamp();
      return data;
    }
  };

  // ============================================
  // 4. LABEL GENERATION
  // ============================================
  const LabelUtils = {
    /**
     * Generate labels for trip options based on pricing
     * @param {Array} options - Array of trip options
     * @returns {Array} Options with labels assigned
     */
    generateOptionLabels(options) {
      if (!options || options.length === 0) return options;
      
      // Create working copy
      const working = [...options];
      
      // Sort by grand total (lowest to highest)
      const sorted = working.sort((a, b) => {
        const totalA = this.getGrandTotal(a);
        const totalB = this.getGrandTotal(b);
        return totalA - totalB;
      });
      
      // Assign labels based on count
      if (sorted.length >= 3) {
        sorted[0].displayMetadata = sorted[0].displayMetadata || {};
        sorted[0].displayMetadata.label = 'Most Affordable';
        
        sorted[1].displayMetadata = sorted[1].displayMetadata || {};
        sorted[1].displayMetadata.label = 'Best Value';
        
        sorted[2].displayMetadata = sorted[2].displayMetadata || {};
        sorted[2].displayMetadata.label = 'Premium Experience';
        
        // Additional options get generic labels
        for (let i = 3; i < sorted.length; i++) {
          sorted[i].displayMetadata = sorted[i].displayMetadata || {};
          sorted[i].displayMetadata.label = `Option ${i + 1}`;
        }
      } else if (sorted.length === 2) {
        sorted[0].displayMetadata = sorted[0].displayMetadata || {};
        sorted[0].displayMetadata.label = 'Budget-Friendly';
        
        sorted[1].displayMetadata = sorted[1].displayMetadata || {};
        sorted[1].displayMetadata.label = 'Premium Option';
      } else if (sorted.length === 1) {
        sorted[0].displayMetadata = sorted[0].displayMetadata || {};
        sorted[0].displayMetadata.label = 'Recommended';
      }
      
      // Return in ORIGINAL order
      return options;
    },

    /**
     * Get grand total from option
     * @param {Object} option - Trip option
     * @returns {number} Grand total
     */
    getGrandTotal(option) {
      if (option.pricing?.grandTotal) {
        return Number(option.pricing.grandTotal);
      }
      
      // Calculate if not present
      return PriceUtils.calculateGrandTotal(option.pricing);
    },

    /**
     * Validate and suggest label improvements
     * @param {string} label - Proposed label
     * @returns {Object} { isValid, suggestion, reason }
     */
    validateLabel(label) {
      if (!label || label.trim() === '') {
        return {
          isValid: false,
          suggestion: 'Best Value',
          reason: 'Label cannot be empty'
        };
      }
      
      const trimmed = label.trim();
      
      // Check length
      if (trimmed.length > 30) {
        return {
          isValid: false,
          suggestion: trimmed.substring(0, 27) + '...',
          reason: 'Label too long (max 30 characters)'
        };
      }
      
      // Check for special characters
      if (!/^[a-zA-Z0-9\s\-'&]+$/.test(trimmed)) {
        return {
          isValid: false,
          suggestion: trimmed.replace(/[^a-zA-Z0-9\s\-'&]/g, ''),
          reason: 'Label contains invalid characters'
        };
      }
      
      return {
        isValid: true,
        suggestion: trimmed,
        reason: 'Label is valid'
      };
    }
  };

  // ============================================
  // 5. VALIDATION UTILITIES
  // ============================================
  const ValidationUtils = {
    /**
     * Validate trip option data structure
     * @param {Object} data - Trip option data
     * @returns {Object} { isValid, errors }
     */
    validateTripOption(data) {
      const errors = [];
      
      // Check required top-level properties
      if (!data.metadata) {
        errors.push('Missing metadata object');
      } else {
        // Validate metadata fields
        if (!data.metadata.tripTitle) errors.push('Missing trip title');
        if (!data.metadata.clientName) errors.push('Missing client name');
        if (!data.metadata.startDate) errors.push('Missing start date');
        if (!data.metadata.endDate) errors.push('Missing end date');
        
        // Validate date format
        if (data.metadata.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.metadata.startDate)) {
          errors.push('Start date must be in YYYY-MM-DD format');
        }
        if (data.metadata.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.metadata.endDate)) {
          errors.push('End date must be in YYYY-MM-DD format');
        }
      }
      
      // Check required sections
      if (!data.overview) errors.push('Missing overview section');
      if (!data.pricing) errors.push('Missing pricing section');
      
      // At least one trip component required
      const hasComponent = data.cruise || 
                          (data.hotels && data.hotels.length > 0) || 
                          (data.flights && data.flights.length > 0);
      
      if (!hasComponent) {
        errors.push('Must have at least one trip component (cruise, hotel, or flight)');
      }
      
      // Validate pricing
      if (data.pricing) {
        if (!data.pricing.grandTotal && !data.pricing.packageTotal) {
          errors.push('Missing grand total or package total in pricing');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    },

    /**
     * Validate required fields before saving
     * @param {Object} data - Data to validate
     * @param {Array} requiredFields - Array of required field paths
     * @returns {Object} { isValid, missing }
     */
    validateRequiredFields(data, requiredFields) {
      const missing = [];
      
      requiredFields.forEach(fieldPath => {
        const value = this.getNestedValue(data, fieldPath);
        if (value === undefined || value === null || value === '') {
          missing.push(fieldPath);
        }
      });
      
      return {
        isValid: missing.length === 0,
        missing: missing
      };
    },

    /**
     * Get nested object value by path
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-notation path (e.g., 'metadata.tripTitle')
     * @returns {*} Value or undefined
     */
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => 
        current?.[key], obj
      );
    },

    /**
     * Sanitize user input
     * @param {string} input - User input
     * @param {string} type - Type of sanitization ('text', 'number', 'date')
     * @returns {string} Sanitized input
     */
    sanitizeInput(input, type = 'text') {
      if (!input) return '';
      
      const str = String(input).trim();
      
      switch (type) {
        case 'number':
          return str.replace(/[^0-9.-]/g, '');
        
        case 'date':
          return str.replace(/[^0-9-]/g, '');
        
        case 'text':
        default:
          // Remove potentially dangerous characters
          return str
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
      }
    }
  };

  // ============================================
  // 6. STORAGE HELPERS (JSONBin)
  // ============================================
  const StorageUtils = {
    /**
     * Get JSONBin headers
     * @param {boolean} includeMaster - Include master key header
     * @returns {Object} Headers object
     */
    getHeaders(includeMaster = false) {
      const headers = {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.JSONBIN_API_KEY
      };
      
      if (includeMaster) {
        headers['X-Bin-Meta'] = 'false';
      }
      
      return headers;
    },

    /**
     * Fetch master index
     * @returns {Promise<Object>} Master index data
     */
    async fetchMasterIndex() {
      try {
        const response = await fetch(
          `${CONFIG.JSONBIN_BASE_URL}/b/${CONFIG.MASTER_INDEX_ID}/latest`,
          { headers: this.getHeaders() }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.record || data;
      } catch (error) {
        console.error('Error fetching master index:', error);
        throw error;
      }
    },

    /**
     * Update master index
     * @param {Object} indexData - Updated index data
     * @returns {Promise<Object>} Response data
     */
    async updateMasterIndex(indexData) {
      try {
        const response = await fetch(
          `${CONFIG.JSONBIN_BASE_URL}/b/${CONFIG.MASTER_INDEX_ID}`,
          {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(indexData)
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error updating master index:', error);
        throw error;
      }
    },

    /**
     * Fetch trip option by bin ID
     * @param {string} binId - JSONBin bin ID
     * @returns {Promise<Object>} Trip option data
     */
    async fetchTripOption(binId) {
      try {
        const response = await fetch(
          `${CONFIG.JSONBIN_BASE_URL}/b/${binId}/latest`,
          { headers: this.getHeaders() }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.record || data;
      } catch (error) {
        console.error('Error fetching trip option:', error);
        throw error;
      }
    },

    /**
     * Create new trip option bin
     * @param {Object} optionData - Trip option data
     * @returns {Promise<Object>} { binId, data }
     */
    async createTripOption(optionData) {
      try {
        // Add creation metadata
        optionData.metadata = optionData.metadata || {};
        optionData.metadata.createdDate = DateUtils.getCurrentTimestamp();
        optionData.metadata.version = CONFIG.VERSION;
        
        const response = await fetch(
          `${CONFIG.JSONBIN_BASE_URL}/b`,
          {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(optionData)
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        return {
          binId: result.metadata.id,
          data: optionData
        };
      } catch (error) {
        console.error('Error creating trip option:', error);
        throw error;
      }
    },

    /**
     * Update existing trip option
     * @param {string} binId - JSONBin bin ID
     * @param {Object} optionData - Updated trip option data
     * @returns {Promise<Object>} Response data
     */
    async updateTripOption(binId, optionData) {
      try {
        // Update lastModified timestamp
        MetadataUtils.updateLastModified(optionData);
        
        const response = await fetch(
          `${CONFIG.JSONBIN_BASE_URL}/b/${binId}`,
          {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(optionData)
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error updating trip option:', error);
        throw error;
      }
    },

    /**
     * Delete trip option bin
     * @param {string} binId - JSONBin bin ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteTripOption(binId) {
      try {
        const response = await fetch(
          `${CONFIG.JSONBIN_BASE_URL}/b/${binId}`,
          {
            method: 'DELETE',
            headers: this.getHeaders()
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return true;
      } catch (error) {
        console.error('Error deleting trip option:', error);
        throw error;
      }
    },

    /**
     * Add trip option to master index
     * @param {string} binId - JSONBin bin ID
     * @param {Object} optionData - Trip option data
     * @returns {Promise<Object>} Updated index
     */
    async addToMasterIndex(binId, optionData) {
      try {
        const index = await this.fetchMasterIndex();
        
        // Ensure options array exists
        if (!index.options) {
          index.options = [];
        }
        
        // Create index entry
        const indexEntry = {
          binId: binId,
          tripTitle: optionData.metadata?.tripTitle || 'Untitled',
          clientName: optionData.metadata?.clientName || '',
          startDate: optionData.metadata?.startDate || '',
          createdDate: optionData.metadata?.createdDate || DateUtils.getCurrentTimestamp(),
          lastModified: optionData.metadata?.lastModified || DateUtils.getCurrentTimestamp()
        };
        
        // Add to beginning of array (newest first)
        index.options.unshift(indexEntry);
        
        // Update master index
        await this.updateMasterIndex(index);
        
        return index;
      } catch (error) {
        console.error('Error adding to master index:', error);
        throw error;
      }
    },

    /**
     * Remove trip option from master index
     * @param {string} binId - JSONBin bin ID to remove
     * @returns {Promise<Object>} Updated index
     */
    async removeFromMasterIndex(binId) {
      try {
        const index = await this.fetchMasterIndex();
        
        if (!index.options) {
          return index;
        }
        
        // Filter out the option
        index.options = index.options.filter(opt => opt.binId !== binId);
        
        // Update master index
        await this.updateMasterIndex(index);
        
        return index;
      } catch (error) {
        console.error('Error removing from master index:', error);
        throw error;
      }
    }
  };

  // ============================================
  // 7. UI HELPERS
  // ============================================
  const UIUtils = {
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in ms (default: 3000)
     */
    showToast(message, type = 'success', duration = 3000) {
      // Remove existing toast
      const existing = document.getElementById('trnt-toast');
      if (existing) {
        existing.remove();
      }
      
      // Create toast element
      const toast = document.createElement('div');
      toast.id = 'trnt-toast';
      toast.className = 'trnt-toast';
      
      // Set styling based on type
      const styles = {
        success: { bg: '#10b981', icon: CONFIG.EMOJI.CHECK },
        error: { bg: '#ef4444', icon: CONFIG.EMOJI.ERROR },
        warning: { bg: '#f59e0b', icon: CONFIG.EMOJI.WARNING },
        info: { bg: '#3b82f6', icon: CONFIG.EMOJI.CHECK }
      };
      
      const style = styles[type] || styles.info;
      
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${style.bg};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
      `;
      
      toast.innerHTML = `
        <span style="font-size: 1.25rem;">${style.icon}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      // Auto-remove after duration
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    /**
     * Show loading spinner
     * @param {string} message - Loading message
     * @returns {Object} Spinner object with remove() method
     */
    showLoading(message = 'Loading...') {
      const overlay = document.createElement('div');
      overlay.id = 'trnt-loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
      `;
      
      overlay.innerHTML = `
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 300px;
        ">
          <div style="
            border: 3px solid #f3f4f6;
            border-top-color: #3b82f6;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          "></div>
          <p style="
            margin: 0;
            color: #374151;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 0.875rem;
            font-weight: 500;
          ">${message}</p>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      return {
        remove: () => {
          const el = document.getElementById('trnt-loading-overlay');
          if (el) el.remove();
        }
      };
    },

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {string} confirmText - Confirm button text
     * @param {string} cancelText - Cancel button text
     * @returns {Promise<boolean>} True if confirmed
     */
    showConfirm(message, confirmText = 'Confirm', cancelText = 'Cancel') {
      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'trnt-confirm-modal';
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        `;
        
        modal.innerHTML = `
          <div style="
            background: white;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 90%;
          ">
            <p style="
              margin: 0 0 1.5rem 0;
              color: #374151;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 1rem;
              line-height: 1.5;
            ">${message}</p>
            <div style="
              display: flex;
              gap: 0.75rem;
              justify-content: flex-end;
            ">
              <button id="trnt-confirm-cancel" style="
                padding: 0.5rem 1.5rem;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                background: white;
                color: #374151;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
              ">${cancelText}</button>
              <button id="trnt-confirm-ok" style="
                padding: 0.5rem 1.5rem;
                border: none;
                border-radius: 0.375rem;
                background: #3b82f6;
                color: white;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
              ">${confirmText}</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const cleanup = () => {
          modal.remove();
        };
        
        document.getElementById('trnt-confirm-ok').addEventListener('click', () => {
          cleanup();
          resolve(true);
        });
        
        document.getElementById('trnt-confirm-cancel').addEventListener('click', () => {
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
    if (document.getElementById('trnt-animations')) return;
    
    const style = document.createElement('style');
    style.id = 'trnt-animations';
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
console.log(`%c🚢 Forge Utils v${ForgeUtils.version} Loaded`, 
  'color: #3b82f6; font-weight: bold; font-size: 14px;');
