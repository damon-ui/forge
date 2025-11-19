# 🔥 FORGE

**Lightweight JavaScript utility library for date formatting, price calculations, and data validation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](https://github.com/damon-ui/forge)

---

## Features

- ✅ **Date Utilities** - Format dates, calculate durations, parse date strings
- ✅ **Price Utilities** - Format currency, calculate totals, parse price strings  
- ✅ **Metadata Utilities** - Extract and validate data structures
- ✅ **Storage Utilities** - JSONBin integration helpers
- ✅ **UI Utilities** - Toast notifications, spinners, modals
- ✅ **Validation Utilities** - Data validation and type checking
- ✅ **Migration Utilities** - Data format migration tools

---

## Installation

### Via CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/forge-utils.js"></script>
```

### Via Raw GitHub

```html
<script src="https://raw.githubusercontent.com/damon-ui/forge/main/forge-utils.js"></script>
```

---

## Quick Start

```javascript
// Date formatting
const formatted = ForgeUtils.Date.formatDate('2026-06-15', 'MMM DD, YYYY');
// Returns: "Jun 15, 2026"

// Date range
const range = ForgeUtils.Date.formatDateRange('2026-06-15', '2026-06-27');
// Returns: "Jun 15-27, 2026"

// Price formatting
const price = ForgeUtils.Price.formatPrice(13594);
// Returns: "$13,594"

// Calculate nights
const nights = ForgeUtils.Date.calculateNights('2026-06-15', '2026-06-27');
// Returns: 12

// Show toast notification
ForgeUtils.UI.showToast('Success!', 'success', 3000);

// Storage operations (requires your own API credentials)
const data = await ForgeUtils.Storage.loadBin(binId, apiKey);
```

---

## API Documentation

### Date Utilities

#### `formatDate(isoDate, format)`
Format ISO date to display format.

```javascript
ForgeUtils.Date.formatDate('2026-06-15', 'MMM DD, YYYY');
// Returns: "Jun 15, 2026"
```

**Supported formats:**
- `MM/DD/YYYY` - 06/15/2026
- `MMM DD, YYYY` - Jun 15, 2026
- `MMMM DD, YYYY` - June 15, 2026
- `MMM DD` - Jun 15
- `YYYY-MM-DD` - 2026-06-15 (ISO)

#### `parseDate(dateString)`
Parse any date format to ISO (YYYY-MM-DD).

```javascript
ForgeUtils.Date.parseDate('June 15, 2026');
// Returns: "2026-06-15"
```

#### `formatDateRange(startDate, endDate)`
Format date range for display.

```javascript
ForgeUtils.Date.formatDateRange('2026-06-15', '2026-06-27');
// Returns: "Jun 15-27, 2026"
```

#### `calculateNights(startDate, endDate)`
Calculate duration in nights.

```javascript
ForgeUtils.Date.calculateNights('2026-06-15', '2026-06-27');
// Returns: 12
```

#### `getCurrentTimestamp()`
Get current timestamp in ISO format.

```javascript
ForgeUtils.Date.getCurrentTimestamp();
// Returns: "2025-11-19T15:30:00.000Z"
```

#### `extractYear(dateString)`
Extract year from date string.

```javascript
ForgeUtils.Date.extractYear('2026-06-15');
// Returns: "2026"
```

---

### Price Utilities

#### `formatPrice(amount, includeCents)`
Format price for display.

```javascript
ForgeUtils.Price.formatPrice(13594);
// Returns: "$13,594"

ForgeUtils.Price.formatPrice(13594.50, true);
// Returns: "$13,594.50"
```

#### `calculatePricePerPerson(total, guests)`
Calculate price per person.

```javascript
ForgeUtils.Price.calculatePricePerPerson(13594, 2);
// Returns: 6797
```

#### `calculateGrandTotal(pricing)`
Calculate total from pricing object.

```javascript
const pricing = {
  packageTotal: 10000,
  flightsTotal: 2000,
  prePostHotelsTotal: 1000,
  additionalCosts: 594
};

ForgeUtils.Price.calculateGrandTotal(pricing);
// Returns: 13594
```

#### `parsePrice(priceString)`
Parse price string to number.

```javascript
ForgeUtils.Price.parsePrice('$13,594.50');
// Returns: 13594.50
```

---

### Metadata Utilities

#### `extractMetadata(tripData)`
Extract metadata from trip data object.

```javascript
const metadata = ForgeUtils.Metadata.extractMetadata(tripData);
// Returns: { tripTitle, clientName, startDate, endDate, guests, ... }
```

#### `generateDisplayMetadata(tripData)`
Generate display-ready metadata for UI cards.

```javascript
const display = ForgeUtils.Metadata.generateDisplayMetadata(tripData);
// Returns: { title, subtitle, dateRange, priceFormatted, ... }
```

#### `validateMetadata(metadata)`
Validate required metadata fields.

```javascript
const result = ForgeUtils.Metadata.validateMetadata(metadata);
// Returns: { valid: true/false, missing: [...fields] }
```

---

### Label Utilities

#### `generateBinName(year, clientName, tripType, optionNumber)`
Generate standardized bin name.

```javascript
ForgeUtils.Label.generateBinName('2026', 'Smith', 'RiverCruise', 1);
// Returns: "2026-Smith-RiverCruise-Option1"
```

#### `parseBinName(binName)`
Parse bin name into components.

```javascript
ForgeUtils.Label.parseBinName('2026-Smith-RiverCruise-Option1');
// Returns: { year: '2026', clientName: 'Smith', tripType: 'RiverCruise', optionNumber: 1 }
```

---

### Validation Utilities

#### `validateTripData(tripData)`
Validate trip data structure.

```javascript
const result = ForgeUtils.Validation.validateTripData(tripData);
// Returns: { valid: true/false, errors: [...messages] }
```

#### `isValidDate(dateString)`
Validate date format (YYYY-MM-DD).

```javascript
ForgeUtils.Validation.isValidDate('2026-06-15');
// Returns: true
```

#### `isValidPrice(price)`
Validate price value.

```javascript
ForgeUtils.Validation.isValidPrice(13594);
// Returns: true
```

#### `isValidEmail(email)`
Validate email format.

```javascript
ForgeUtils.Validation.isValidEmail('user@example.com');
// Returns: true
```

---

### Storage Utilities

**Note:** All storage functions require API credentials as parameters. You must provide your own JSONBin API key and bin IDs.

#### `loadMasterIndex(apiKey, indexId)`
Load master index from JSONBin.

```javascript
const index = await ForgeUtils.Storage.loadMasterIndex(
    'your-api-key',
    'your-index-id'
);
```

#### `saveMasterIndex(indexData, apiKey, indexId)`
Save master index to JSONBin.

```javascript
await ForgeUtils.Storage.saveMasterIndex(
    indexData,
    'your-api-key',
    'your-index-id'
);
```

#### `loadBin(binId, apiKey)`
Load individual bin data.

```javascript
const data = await ForgeUtils.Storage.loadBin('bin-id', 'your-api-key');
```

#### `createBin(data, apiKey, binName)`
Create new bin.

```javascript
const response = await ForgeUtils.Storage.createBin(
    data,
    'your-api-key',
    'optional-bin-name'
);
```

#### `updateBin(binId, data, apiKey)`
Update existing bin.

```javascript
await ForgeUtils.Storage.updateBin('bin-id', data, 'your-api-key');
```

#### `deleteBin(binId, apiKey)`
Delete bin.

```javascript
await ForgeUtils.Storage.deleteBin('bin-id', 'your-api-key');
```

---

### UI Utilities

#### `showToast(message, type, duration)`
Show toast notification.

```javascript
ForgeUtils.UI.showToast('Success!', 'success', 3000);
```

**Types:** `success`, `error`, `info`, `warning`

#### `showSpinner(message)`
Show loading spinner.

```javascript
const spinner = ForgeUtils.UI.showSpinner('Loading...');
// Later: spinner.remove();
```

#### `hideSpinner()`
Hide loading spinner.

```javascript
ForgeUtils.UI.hideSpinner();
```

#### `showConfirm(message, confirmText, cancelText)`
Show confirmation dialog.

```javascript
const confirmed = await ForgeUtils.UI.showConfirm(
    'Are you sure?',
    'Yes',
    'No'
);

if (confirmed) {
    // User clicked Yes
}
```

#### `animateIn(element, animation)`
Animate element entrance.

```javascript
ForgeUtils.UI.animateIn(element, 'fadeIn');
```

**Animations:** `fadeIn`, `slideIn`, `scaleIn`

---

### Migration Utilities

#### `migrateToV3(oldData)`
Migrate old format to v3.0 unified format.

```javascript
const migrated = ForgeUtils.Migration.migrateToV3(oldData);
```

#### `batchMigrate(options)`
Batch migrate multiple trip options.

```javascript
const migrated = ForgeUtils.Migration.batchMigrate(oldOptions);
```

---

## Configuration

FORGE includes emoji constants for consistent UI display:

```javascript
ForgeUtils.CONFIG.EMOJI.SHIP      // 🚢
ForgeUtils.CONFIG.EMOJI.PLANE     // ✈️
ForgeUtils.CONFIG.EMOJI.HOTEL     // 🏨
ForgeUtils.CONFIG.EMOJI.CALENDAR  // 📅
ForgeUtils.CONFIG.EMOJI.MONEY     // 💵
ForgeUtils.CONFIG.EMOJI.CHECK     // ✅
ForgeUtils.CONFIG.EMOJI.WARNING   // ⚠️
ForgeUtils.CONFIG.EMOJI.ERROR     // ❌
```

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ required
- Async/await support required for Storage utilities

---

## Version

Current version: **3.0.0**

```javascript
console.log(ForgeUtils.version);
// Returns: "3.0.0"
```

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## Author

Damon Sipe

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

**Built for modern web applications 🚀**
