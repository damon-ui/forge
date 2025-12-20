/**
 * FORGE PDF Utility
 * Simple wrapper for trnt-pdf Cloudflare Worker
 * 
 * @version 1.0.0
 * CDN: https://cdn.jsdelivr.net/gh/damon-ui/forge@main/js/forge-pdf.js
 */

(function() {
  'use strict';

  const WORKER_URL = 'https://trnt-pdf.trnt.workers.dev';

  /**
   * Download PDF of current page
   * @param {string} filename - Filename for the PDF download
   * @param {HTMLElement} buttonElement - Optional button element to show loading state
   */
  async function download(filename, buttonElement) {
    // Get current URL and add ?print=true parameter
    const currentUrl = window.location.href;
    const separator = currentUrl.includes('?') ? '&' : '?';
    const urlWithPrint = currentUrl + separator + 'print=true';

    // Show loading state if button provided
    let button = buttonElement || null;
    let originalButtonText = '';
    let originalButtonDisabled = false;
    
    if (button && button.tagName === 'BUTTON') {
      originalButtonText = button.textContent;
      originalButtonDisabled = button.disabled;
      button.disabled = true;
      button.textContent = 'Generating PDF...';
    }

    try {
      // Call the PDF worker
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlWithPrint,
          filename: filename || 'document.pdf'
        })
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status} ${response.statusText}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to generate PDF: ' + error.message);
    } finally {
      // Restore button state
      if (button && button.tagName === 'BUTTON') {
        button.disabled = originalButtonDisabled;
        button.textContent = originalButtonText;
      }
    }
  }

  // Export to global scope
  window.ForgePdf = {
    download: download
  };
})();

