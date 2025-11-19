# FORGE v3.0 - Quick Reference Card

**Keep this handy while building!**

---

## 🔗 Include FORGE in Your Tools

```html
<script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/v3.0/core/forge-utils.js"></script>
```

Or fallback:
```html
<script src="https://raw.githubusercontent.com/damon-ui/forge/main/v3.0/core/forge-utils.js"></script>
```

---

## 📅 Date Functions

```javascript
// Format date
ForgeUtils.Date.formatDate('2026-06-15');
// → "06/15/2026"

ForgeUtils.Date.formatDate('2026-06-15', 'MMM DD, YYYY');
// → "Jun 15, 2026"

// Format date range
ForgeUtils.Date.formatDateRange('2026-06-15', '2026-06-27');
// → "Jun 15-27, 2026"

// Calculate nights
ForgeUtils.Date.calculateNights('2026-06-15', '2026-06-27');
// → 12

// Extract year
ForgeUtils.Date.extractYear('2026-06-15');
// → "2026"

// Parse any date to ISO
ForgeUtils.Date.parseDate('06/15/2026');
// → "2026-06-15"

// Get current timestamp
ForgeUtils.Date.getCurrentTimestamp();
// → "2025-11-18T17:00:00Z"
```

---

## 💰 Price Functions

```javascript
// Format price
ForgeUtils.Price.formatPrice(13594);
// → "$13,594"

ForgeUtils.Price.formatPrice(13594.50, true);
// → "$13,594.50"

// Calculate per person
ForgeUtils.Price.calculatePricePerPerson(13594, 2);
// → 6797

// Calculate grand total
ForgeUtils.Price.calculateGrandTotal(pricingObject);
// → (sum of all pricing components)

// Parse price string
ForgeUtils.Price.parsePrice('$13,594');
// → 13594
```

---

## 🏷️ Metadata Functions

```javascript
// Extract last name
ForgeUtils.Metadata.extractClientLastName('John and Jane Smith');
// → "Smith"

// Generate metadata object
ForgeUtils.Metadata.generateMetadata(tripData);
// → Complete metadata with timestamps

// Generate display metadata
ForgeUtils.Metadata.generateDisplayMetadata(tripData);
// → title, subtitle, label, dates

// Generate title
ForgeUtils.Metadata.generateTitle(tripData);
// → "AmaWaterways AmaMagna"

// Generate subtitle
ForgeUtils.Metadata.generateSubtitle(tripData);
// → "Grand Suite · Jun 16-27, 2026"

// Generate URL slug
ForgeUtils.Metadata.generateShareableURL(tripData);
// → "2026-smith-cruise"

// Generate filename
ForgeUtils.Metadata.generateFileName(tripData);
// → "John_and_Jane_Smith_Danube_Cruise_2026.pdf"

// Update last modified
ForgeUtils.Metadata.updateLastModified(tripData);
// → Updates metadata.lastModified timestamp
```

---

## ⭐ Label Functions

```javascript
// Generate labels for options
const options = [option1, option2, option3];
ForgeUtils.Label.generateOptionLabels(options);
// → Assigns: "Most Affordable", "Best Value", "Premium Experience"

// Validate label
ForgeUtils.Label.validateLabel('Best Value');
// → { isValid: true, suggestion: "Best Value", reason: "Label is valid" }
```

---

## ✅ Validation Functions

```javascript
// Validate trip option
const result = ForgeUtils.Validation.validateTripOption(tripData);
if (!result.isValid) {
  console.log('Errors:', result.errors);
}

// Validate required fields
const check = ForgeUtils.Validation.validateRequiredFields(
  tripData, 
  ['metadata.tripTitle', 'metadata.clientName']
);

// Sanitize input
ForgeUtils.Validation.sanitizeInput(userInput, 'text');
// types: 'text', 'number', 'date'
```

---

## 💾 Storage Functions (JSONBin)

```javascript
// Fetch master index
const index = await ForgeUtils.Storage.fetchMasterIndex();

// Update master index
await ForgeUtils.Storage.updateMasterIndex(indexData);

// Fetch trip option
const trip = await ForgeUtils.Storage.fetchTripOption(binId);

// Create trip option
const result = await ForgeUtils.Storage.createTripOption(tripData);
// → { binId: "...", data: {...} }

// Update trip option
await ForgeUtils.Storage.updateTripOption(binId, tripData);

// Delete trip option
await ForgeUtils.Storage.deleteTripOption(binId);

// Add to master index
await ForgeUtils.Storage.addToMasterIndex(binId, tripData);

// Remove from master index
await ForgeUtils.Storage.removeFromMasterIndex(binId);
```

---

## 🎨 UI Functions

```javascript
// Show toast notification
ForgeUtils.UI.showToast('Trip saved!', 'success');
// types: 'success', 'error', 'warning', 'info'

ForgeUtils.UI.showToast('Error occurred', 'error', 5000);
// Optional duration in ms (default: 3000)

// Show loading spinner
const loader = ForgeUtils.UI.showLoading('Saving trip...');
// ... do work ...
loader.remove();

// Show confirmation dialog
const confirmed = await ForgeUtils.UI.showConfirm(
  'Delete this trip?',
  'Yes, Delete',
  'Cancel'
);
if (confirmed) {
  // User clicked Yes
}

// Animate element
ForgeUtils.UI.animateIn(element, 'fadeIn');
// animations: 'fadeIn', 'slideIn', 'scaleIn'
```

---

## 🔄 Migration Functions

```javascript
// Migrate v2.0 to v3.0
const newData = ForgeUtils.Migration.migrateToV3(oldData);

// Batch migrate
const newOptions = ForgeUtils.Migration.batchMigrate(oldOptions);
```

---

## 🎯 Common Patterns

### Loading and Displaying Trip

```javascript
// Load from JSONBin
const trip = await ForgeUtils.Storage.fetchTripOption(binId);

// Validate
const validation = ForgeUtils.Validation.validateTripOption(trip);
if (!validation.isValid) {
  ForgeUtils.UI.showToast('Invalid trip data', 'error');
  return;
}

// Display dates
document.getElementById('dates').textContent = 
  ForgeUtils.Date.formatDateRange(trip.metadata.startDate, trip.metadata.endDate);

// Display price
document.getElementById('price').textContent = 
  ForgeUtils.Price.formatPrice(trip.pricing.grandTotal);

// Display title
document.getElementById('title').textContent = 
  trip.displayMetadata.title;
```

### Saving Trip with Feedback

```javascript
try {
  const loader = ForgeUtils.UI.showLoading('Saving trip...');
  
  // Update timestamp
  ForgeUtils.Metadata.updateLastModified(tripData);
  
  // Save to JSONBin
  await ForgeUtils.Storage.updateTripOption(binId, tripData);
  
  loader.remove();
  ForgeUtils.UI.showToast('Trip saved successfully!', 'success');
} catch (error) {
  ForgeUtils.UI.showToast('Failed to save trip', 'error');
  console.error(error);
}
```

### Generating Labels for Comparison

```javascript
// Fetch all options
const options = await Promise.all(
  binIds.map(id => ForgeUtils.Storage.fetchTripOption(id))
);

// Generate labels
const labeled = ForgeUtils.Label.generateOptionLabels(options);

// Display
labeled.forEach(option => {
  console.log(
    option.displayMetadata.label,
    ForgeUtils.Price.formatPrice(option.pricing.grandTotal)
  );
});
```

---

## 🔑 Configuration

```javascript
// Access config
ForgeUtils.CONFIG.JSONBIN_API_KEY
ForgeUtils.CONFIG.MASTER_INDEX_ID
ForgeUtils.CONFIG.VERSION  // "3.0.0"
ForgeUtils.CONFIG.EMOJI.SHIP  // "\u{1F6A2}"
```

---

## 📚 Full Documentation

- [JSON Format Spec](v3.0/docs/UNIFIED-JSON-FORMAT-v3.0.md)
- [Utility API Docs](v3.0/docs/UTILITY-API.md)
- [Migration Guide](v3.0/docs/MIGRATION.md)

---

**🔥 Built with FORGE | Powering TRNT Travel**
