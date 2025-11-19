# FORGE

**The Engine Powering TRNT Travel**

FORGE is the internal development framework for building luxury travel advisor tools. It provides the foundation, utilities, and architecture that power client-facing TRNT Travel experiences.

---

## 🎯 What is FORGE?

FORGE is a collection of:
- **Core utilities** - Reusable functions for dates, prices, metadata, validation
- **JSON format standards** - Unified data structure for all trip types
- **Internal tools** - Admin portals, builders, and workflow tools
- **Testing framework** - Automated validation and quality assurance

---

## 🏗️ Architecture

```
FORGE (Internal Engine)
    ↓
Powers TRNT Travel Tools
    ↓
Delivers Client Experience
```

**Internal Tools (FORGE branded):**
- 🔨 FORGE Admin Portal
- 🔨 FORGE Details Builder  
- 🔨 FORGE AI Builder
- 🔨 FORGE Quick Trip Builder

**Client-Facing Tools (TRNT branded):**
- 🚢 TRNT Comparison Tool
- 🚢 TRNT Itinerary Builder

---

## 📦 What's Included

### v3.0 (Current)
- **Core Utilities** (`v3.0/core/forge-utils.js`)
  - Date formatting and calculations
  - Price formatting and calculations  
  - Metadata generation
  - Label generation
  - Validation
  - JSONBin storage helpers
  - UI components
  - Data migration

- **Format Specification** (`v3.0/docs/UNIFIED-JSON-FORMAT-v3.0.md`)
  - Complete JSON structure
  - Supports all trip types
  - Simple structure for common cases
  - Flexible components for complex trips

- **Test Suite** (`v3.0/tests/`)
  - Automated validation
  - Sample trip data
  - Test harness

---

## 🚀 Quick Start

### Include in Your Tools

**Option 1: CDN (Recommended)**
```html
<script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/v3.0/core/forge-utils.js"></script>
```

**Option 2: Direct Include**
```html
<script src="forge-utils.js"></script>
```

### Basic Usage

```javascript
// Format a date
const display = ForgeUtils.Date.formatDateRange('2026-06-15', '2026-06-27');
// → "Jun 15-27, 2026"

// Format a price
const price = ForgeUtils.Price.formatPrice(13594);
// → "$13,594"

// Generate labels for options
const labeled = ForgeUtils.Label.generateOptionLabels(tripOptions);

// Validate trip data
const validation = ForgeUtils.Validation.validateTripOption(tripData);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}

// Show a toast notification
ForgeUtils.UI.showToast('Trip saved successfully!', 'success');
```

---

## 📁 Repository Structure

```
forge/
├── README.md                 # This file
├── v3.0/                     # Version 3.0
│   ├── core/                 # Core utilities
│   │   └── forge-utils.js    # Main utility library
│   ├── tools/                # Tool implementations
│   │   ├── admin/            # Admin Portal
│   │   ├── comparison/       # Comparison Tool
│   │   ├── itinerary/        # Itinerary Builder
│   │   ├── details/          # Details Builder
│   │   ├── quicktrip/        # Quick Trip Builder
│   │   └── forge/            # AI JSON Builder
│   ├── tests/                # Test files
│   │   └── test-rocky-mountaineer.json
│   └── docs/                 # Documentation
│       └── UNIFIED-JSON-FORMAT-v3.0.md
```

---

## 🔧 Development

### Prerequisites
- Modern browser (Chrome, Safari, Firefox)
- JSONBin account (for data storage)
- Squarespace site (for deployment)

### Local Development
1. Clone this repository
2. Open tool HTML files in browser
3. Edit and test locally
4. Deploy to Squarespace when ready

### Testing
1. Open `v3.0/tests/test-harness.html` in browser
2. Verify all tests pass
3. Test with real trip data

---

## 📚 Documentation

- [JSON Format Specification](v3.0/docs/UNIFIED-JSON-FORMAT-v3.0.md) - Complete data structure
- [Utility API Reference](v3.0/docs/UTILITY-API.md) - Function documentation
- [Migration Guide](v3.0/docs/MIGRATION.md) - Upgrading from v2.0
- [Component Library](v3.0/docs/COMPONENTS.md) - All supported trip types

---

## 🎯 Design Principles

1. **One Format, No Conversions** - All tools use unified JSON structure
2. **Simple by Default** - Common patterns use top-level fields
3. **Flexible When Needed** - Components array for complex cases
4. **Backward Compatible** - New versions don't break old data
5. **Future Proof** - Can handle any trip type

---

## 📊 Version History

### v3.0.0 (November 18, 2025)
- 🎉 Complete rebuild of foundation
- ✅ Unified JSON format for all trip types
- ✅ Comprehensive utility library
- ✅ Simple + flexible architecture
- ✅ 100% test coverage
- ✅ FORGE branding established

### v2.0 (November 16, 2025)
- Legacy version (deprecated)
- Data format inconsistencies
- Archived for reference

---

## 🤝 Contributing

This is a private repository for TRNT Travel internal development. 

For questions or suggestions, contact: damon@trnttravel.com

---

## 📄 License

Proprietary - © 2025 TRNT Travel. All rights reserved.

---

## 🔥 Built with FORGE

**Forging Unforgettable Journeys**
