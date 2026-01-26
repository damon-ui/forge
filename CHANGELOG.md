# Changelog

All notable changes to FORGE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.2.42] - 2026-01-26

### Added - Mobile MVM (TRN-578)
- **Mobile utilities** (`mobile.js`): `isMobile()`, `isTouchDevice()`, `onMobileChange()`, `emailMeLink()`
- **Share utilities** (`share.js`): `shareOrCopy()` with native share sheet support
- **Admin hamburger menu**: Slide-out navigation on mobile (<768px)
- **CRM mobile modal**: Read-only client detail view with contact links and deep link support
- **Mobile list views**: Comparisons and Itineraries with Copy Link/Preview actions
- **Desktop gates**: 9 tools gated on mobile with "Email Me This Link" escape hatch
- **PWA support**: manifest.json + app icons for "Add to Home Screen"
- **Mobile nav management**: Hide Stats/Payments/Commissions, gate Options/Forms/Settings

---

## [Unreleased] - forge-saas

### Changed

- **Itinerary Cards** - Removed created date display from admin portal cards (matches Options/Comparisons pattern)
- **AI Enrich Button** - Changed from purple gradient to FORGE orange, shows dynamic item count ("Apply 11 Items")

---

## [3.2.38] - 2025-12-19

### Added

- **ForgePdf** - PDF download utility for client-facing pages
  - `ForgePdf.download(filename, buttonElement)` - Generates PDF via trnt-pdf worker
  - Handles button loading state automatically

### Changed

- Added `.no-print` utility class and `@media print` styles to forge-common.css

---

## [3.2.30] - 2025-12-13

### Added

- **ForgeEmailModal** (TRN-21) - New module for sending branded emails to clients
  - `ForgeEmailModal.init({ modalId })` - Auto-injects modal HTML
  - `ForgeEmailModal.open({ clientName, toolType, itemUrl, onSuccess })` - Opens modal with pre-filled fields
  - `ForgeEmailModal.close()` - Closes modal
  - Supports itinerary and comparison tool types
  - Sends via Resend API through Cloudflare Worker
  - Optional personal message field

---

## [3.2.29] - 2025-12-13

### Changed

- Version bump to resolve jsDelivr CDN cache issue with v3.2.28

---

## [3.2.28] - 2025-12-12

### Added

- **Retry Logic with Exponential Backoff** - All JSONBin API calls in `ForgeUtils.Storage` now automatically retry on rate limits (429) and server errors (5xx)
  - `fetchWithRetry()` helper function with configurable retry attempts (default: 3)
  - Exponential backoff delays: 1s, 2s, 4s
  - Console warnings for retry attempts with `[FORGE]` prefix
  - Applies to: `loadMasterIndex()`, `saveMasterIndex()`, `loadBin()`, `createBin()`, `updateBin()`, `deleteBin()`

### Changed

- Improved reliability for all Storage operations during network issues or API rate limits

---

## [3.0.0] - 2025-11-19

### 🔐 Security

- **CRITICAL**: Removed all hardcoded API credentials from source code
- Storage functions now require credentials as parameters for security
- Made repository safe for public distribution and CDN access

### ⚠️ Breaking Changes

- `Storage.loadMasterIndex()` now requires `(apiKey, indexId)` parameters
- `Storage.saveMasterIndex()` now requires `(data, apiKey, indexId)` parameters
- `Storage.loadBin()` now requires `(binId, apiKey)` parameters
- `Storage.createBin()` now requires `(data, apiKey, binName)` parameters
- `Storage.updateBin()` now requires `(binId, data, apiKey)` parameters
- `Storage.deleteBin()` now requires `(binId, apiKey)` parameters

Applications using FORGE must now provide their own credentials when calling Storage functions.

### Changed

- Simplified repository structure (forge-utils.js at root)
- Updated header to generic "FORGE - JavaScript Utility Library"
- Changed branding from internal project name to generic FORGE
- Updated console message to "🔥 FORGE v3.0.0 Loaded"

### Added

- Complete date formatting utilities
  - `formatDate()` - Format ISO dates with multiple pattern support
  - `parseDate()` - Convert any date format to ISO
  - `formatDateRange()` - Format date ranges intelligently
  - `calculateNights()` - Calculate duration between dates
  - `getCurrentTimestamp()` - Get current ISO timestamp
  - `extractYear()` - Extract year from any date string

- Price calculation and formatting
  - `formatPrice()` - Format currency with optional cents
  - `calculatePricePerPerson()` - Calculate per-person costs
  - `calculateGrandTotal()` - Sum pricing object components
  - `parsePrice()` - Parse price strings to numbers

- Metadata extraction and validation
  - `extractMetadata()` - Extract metadata from data objects
  - `generateDisplayMetadata()` - Generate UI-ready metadata
  - `validateMetadata()` - Validate required fields
  - `generateSubtitle()` - Create formatted subtitles

- Label generation utilities
  - `generateBinName()` - Create standardized naming
  - `parseBinName()` - Parse names into components
  - `generateTripLabel()` - Generate display labels

- Validation utilities
  - `validateTripData()` - Validate data structures
  - `isValidDate()` - Validate ISO date format
  - `isValidPrice()` - Validate price values
  - `isValidEmail()` - Validate email format

- JSONBin storage helpers (credential-based)
  - `loadMasterIndex()` - Load index from JSONBin
  - `saveMasterIndex()` - Save index to JSONBin
  - `loadBin()` - Load individual bin
  - `createBin()` - Create new bin
  - `updateBin()` - Update existing bin
  - `deleteBin()` - Delete bin

- UI components
  - `showToast()` - Display toast notifications
  - `showSpinner()` - Show loading spinner
  - `hideSpinner()` - Hide loading spinner
  - `showConfirm()` - Display confirmation dialog
  - `animateIn()` - Animate element entrance

- Data migration utilities
  - `migrateToV3()` - Migrate old formats to v3.0
  - `migrateMetadata()` - Migrate metadata section
  - `migratePricing()` - Migrate pricing section
  - `migrateHotels()` - Migrate hotels section
  - `batchMigrate()` - Batch migrate multiple items

- Configuration constants
  - Emoji constants for consistent UI display
  - Version tracking
  - Public API structure

### Documentation

- Added comprehensive README with API documentation
- Added CHANGELOG for version tracking
- Added MIT License for open-source distribution
- Code comments improved throughout

---

## [2.0.0] - 2025-11-17

### Note

This version was internal-only and contained hardcoded credentials. It was never published publicly.

### Added

- Initial utility library structure
- Date and price utilities
- Basic storage integration
- UI helper functions

### Security Issues

- ⚠️ Contained hardcoded API credentials (fixed in 3.0.0)
- ⚠️ Not suitable for public distribution

---

## Release Notes

### Version 3.0.0 - Security & Public Release

This is the first public release of FORGE. The primary focus of this release is security - all hardcoded credentials have been removed and the library now requires applications to provide their own credentials when using Storage functions.

**Migration Guide:**

If migrating from internal version 2.0.0, you'll need to update all Storage function calls:

```javascript
// Old (v2.0.0 - internal only)
await ForgeUtils.Storage.loadMasterIndex();

// New (v3.0.0 - public)
await ForgeUtils.Storage.loadMasterIndex(apiKey, indexId);
```

This breaking change ensures that FORGE can be safely distributed via public CDN while protecting your application's credentials.

---

## Semantic Versioning

FORGE follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (3.x.x) - Incompatible API changes
- **MINOR** version (x.0.x) - Backwards-compatible new features  
- **PATCH** version (x.x.0) - Backwards-compatible bug fixes

---

## Links

- [Repository](https://github.com/damon-ui/forge)
- [CDN (jsDelivr)](https://cdn.jsdelivr.net/gh/damon-ui/forge@main/forge-utils.js)
- [License](LICENSE)

---

**Last Updated:** November 19, 2025
