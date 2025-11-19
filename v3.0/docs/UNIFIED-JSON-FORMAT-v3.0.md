# TRNT Travel Tools - Unified JSON Format Specification v3.0

**Version:** 3.0.0  
**Date:** November 18, 2025  
**Status:** 🟢 Official Specification  

---

## 🎯 DESIGN PHILOSOPHY

**Primary Goal:** Support 95% of typical bookings (Flight + Cruise OR Flight + Hotel) with simple, clean structure.

**Secondary Goal:** Provide flexibility for complex trips through optional components array.

**Key Principles:**
1. **One format, no conversions** - All tools read the same structure
2. **Simple by default** - Common patterns use top-level fields
3. **Flexible when needed** - Components array for edge cases
4. **Backward compatible** - Existing tools continue working
5. **Future-proof** - Can handle any trip type

---

## 📋 COMPLETE FORMAT STRUCTURE

```json
{
  "metadata": {
    "tripTitle": "string (REQUIRED)",
    "clientName": "string (REQUIRED)",
    "startDate": "YYYY-MM-DD (REQUIRED)",
    "endDate": "YYYY-MM-DD (REQUIRED)",
    "guests": "number (REQUIRED, default: 2)",
    "createdDate": "ISO 8601 timestamp (auto-generated)",
    "lastModified": "ISO 8601 timestamp (auto-updated)",
    "version": "string (3.0.0)",
    "tripType": "string (optional: cruise, hotel, resort, safari, etc.)",
    "destination": "string (optional: primary destination)"
  },
  
  "overview": {
    "summary": "string (optional: trip overview for client)",
    "vendor": "string (optional: primary vendor/supplier)",
    "bookingReference": "string (optional: confirmation/booking number)",
    "tripType": "string (optional: cruise, independent, tour, etc.)",
    "highlights": ["string array (optional: key selling points)"],
    "notes": "string (optional: internal notes)"
  },
  
  "pricing": {
    "packageTotal": "number (optional: base package cost)",
    "flightsTotal": "number (optional: total flight cost)",
    "prePostHotelsTotal": "number (optional: hotel costs outside main component)",
    "additionalCosts": "number (optional: transfers, insurance, etc.)",
    "grandTotal": "number (REQUIRED: total trip cost)",
    "perPerson": "number (calculated: grandTotal / guests)",
    "currency": "string (optional, default: USD)",
    "deposit": "number (optional: required deposit amount)",
    "finalPaymentDue": "YYYY-MM-DD (optional: final payment date)",
    "breakdown": {
      "notes": "string (optional: pricing notes for client)"
    }
  },
  
  "flights": [
    {
      "id": "string (optional: unique identifier)",
      "type": "string (outbound, return, internal)",
      "airline": "string (REQUIRED)",
      "flightNumber": "string (optional)",
      "departure": {
        "airport": "string (REQUIRED: 3-letter code)",
        "city": "string (optional)",
        "date": "YYYY-MM-DD (REQUIRED)",
        "time": "HH:MM (optional, 24-hour format)"
      },
      "arrival": {
        "airport": "string (REQUIRED: 3-letter code)",
        "city": "string (optional)",
        "date": "YYYY-MM-DD (REQUIRED)",
        "time": "HH:MM (optional, 24-hour format)"
      },
      "cabin": "string (Economy, Premium Economy, Business, First)",
      "duration": "string (optional: flight duration)",
      "layovers": [
        {
          "airport": "string (3-letter code)",
          "duration": "string (layover duration)"
        }
      ],
      "price": "number (optional: flight cost)",
      "pricePerPerson": "number (optional)",
      "bookingClass": "string (optional: fare class)",
      "baggage": "string (optional: baggage allowance)",
      "notes": "string (optional)"
    }
  ],
  
  "hotels": [
    {
      "id": "string (optional: unique identifier)",
      "name": "string (REQUIRED)",
      "location": "string (REQUIRED: city/area)",
      "address": "string (optional: full address)",
      "checkIn": "YYYY-MM-DD (REQUIRED)",
      "checkOut": "YYYY-MM-DD (REQUIRED)",
      "nights": "number (calculated from check-in/out)",
      "roomType": "string (REQUIRED: room category)",
      "roomDescription": "string (optional: detailed room info)",
      "bedConfiguration": "string (optional: King, 2 Queens, etc.)",
      "view": "string (optional: Ocean View, City View, etc.)",
      "amenities": ["string array (optional: WiFi, Breakfast, etc.)"],
      "mealPlan": "string (optional: Room Only, Breakfast, Half Board, etc.)",
      "price": "number (optional: total hotel cost)",
      "pricePerNight": "number (optional)",
      "pricePerPerson": "number (optional)",
      "starRating": "number (optional: 1-5)",
      "category": "string (optional: pre-trip, main, post-trip)",
      "bookingReference": "string (optional)",
      "cancellationPolicy": "string (optional)",
      "specialRequests": "string (optional)",
      "notes": "string (optional)"
    }
  ],
  
  "cruise": {
    "cruiseLine": "string (REQUIRED: e.g., AmaWaterways)",
    "shipName": "string (REQUIRED: e.g., AmaMagna)",
    "cruiseType": "string (optional: river, ocean, expedition)",
    "itinerary": "string (REQUIRED: route description)",
    "embarkation": {
      "port": "string (REQUIRED)",
      "city": "string (optional)",
      "date": "YYYY-MM-DD (REQUIRED)",
      "time": "HH:MM (optional)"
    },
    "disembarkation": {
      "port": "string (REQUIRED)",
      "city": "string (optional)",
      "date": "YYYY-MM-DD (REQUIRED)",
      "time": "HH:MM (optional)"
    },
    "nights": "number (REQUIRED: cruise duration)",
    "cabinCategory": "string (REQUIRED: cabin type)",
    "cabinNumber": "string (optional: assigned cabin)",
    "cabinDescription": "string (optional: detailed cabin info)",
    "deck": "string (optional: deck level)",
    "cabinFeatures": ["string array (optional: Balcony, Suite, etc.)"],
    "diningPackage": "string (optional: included dining options)",
    "beveragePackage": "string (optional: included beverages)",
    "excursions": {
      "included": ["string array (optional: included shore excursions)"],
      "optional": [
        {
          "name": "string",
          "description": "string",
          "price": "number",
          "duration": "string"
        }
      ]
    },
    "inclusions": ["string array (optional: what's included)"],
    "price": "number (optional: cruise cost)",
    "pricePerPerson": "number (optional)",
    "bookingReference": "string (optional)",
    "specialRequests": "string (optional: dietary, accessibility, etc.)",
    "notes": "string (optional)"
  },
  
  "preTrip": {
    "type": "string (hotel, excursion, transfer)",
    "description": "string (REQUIRED)",
    "location": "string (optional)",
    "date": "YYYY-MM-DD (optional)",
    "duration": "string (optional)",
    "included": ["string array (optional)"],
    "price": "number (optional)",
    "notes": "string (optional)"
  },
  
  "postTrip": {
    "type": "string (hotel, excursion, transfer)",
    "description": "string (REQUIRED)",
    "location": "string (optional)",
    "date": "YYYY-MM-DD (optional)",
    "duration": "string (optional)",
    "included": ["string array (optional)"],
    "price": "number (optional)",
    "notes": "string (optional)"
  },
  
  "components": [
    {
      "id": "string (REQUIRED: unique identifier, e.g., comp-001)",
      "type": "string (REQUIRED: flight, hotel, cruise, vrbo, airbnb, train, safari, activity, transfer, car_rental, etc.)",
      "category": "string (optional: main, pre-trip, post-trip, optional)",
      "order": "number (REQUIRED: chronological order, 1-based)",
      "data": {
        "// Component-specific fields go here": "See component type schemas below"
      },
      "externalLink": "string (optional: link to VRBO, Airbnb, external booking, etc.)",
      "presentationOnly": "boolean (optional: true if showing but not booking)",
      "notes": "string (optional)"
    }
  ],
  
  "displayMetadata": {
    "title": "string (auto-generated: primary display title)",
    "subtitle": "string (auto-generated: secondary info)",
    "label": "string (optional: Best Value, Most Affordable, etc.)",
    "dates": {
      "display": "string (formatted date range: Jun 15-27, 2026)",
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    },
    "heroImage": "string (optional: URL to primary trip image)",
    "emoji": "string (optional: trip type emoji using \\u{} format)"
  }
}
```

---

## 🔧 COMPONENT TYPE SCHEMAS

When using the `components` array for complex trips, each component type has its own schema:

### VRBO/Airbnb Component
```json
{
  "id": "comp-001",
  "type": "vrbo",
  "category": "main",
  "order": 2,
  "data": {
    "propertyName": "Luxury Villa in Tuscany",
    "location": "Tuscany, Italy",
    "checkIn": "2026-06-15",
    "checkOut": "2026-06-22",
    "nights": 7,
    "bedrooms": 4,
    "bathrooms": 3,
    "maxGuests": 8,
    "amenities": ["Pool", "Chef", "Wine cellar", "WiFi"],
    "pricePerNight": 450,
    "totalPrice": 3150,
    "description": "Beautiful restored farmhouse..."
  },
  "externalLink": "https://www.vrbo.com/1234567",
  "presentationOnly": true,
  "notes": "Client may book directly"
}
```

### Train Journey Component
```json
{
  "id": "comp-002",
  "type": "train",
  "category": "main",
  "order": 3,
  "data": {
    "trainLine": "Rocky Mountaineer",
    "routeName": "First Passage to the West",
    "departure": {
      "station": "Vancouver",
      "date": "2026-06-20",
      "time": "07:30"
    },
    "arrival": {
      "station": "Banff",
      "date": "2026-06-22",
      "time": "18:00"
    },
    "days": 2,
    "serviceLevel": "GoldLeaf Service",
    "cabinType": "Single",
    "mealsIncluded": true,
    "price": 2450,
    "pricePerPerson": 2450
  },
  "externalLink": null,
  "notes": "Includes all meals and hotel in Kamloops"
}
```

### Safari Component
```json
{
  "id": "comp-003",
  "type": "safari",
  "category": "main",
  "order": 4,
  "data": {
    "campName": "Singita Sasakwa Lodge",
    "location": "Serengeti, Tanzania",
    "checkIn": "2026-07-10",
    "checkOut": "2026-07-14",
    "nights": 4,
    "roomType": "Suite",
    "inclusions": [
      "All meals and beverages",
      "Game drives twice daily",
      "Walking safaris",
      "Laundry service",
      "Park fees"
    ],
    "activities": ["Game drives", "Bush walks", "Cultural visits"],
    "price": 8900,
    "pricePerPerson": 4450,
    "vehicle": "Private (dedicated guide)"
  },
  "notes": "Best time for Great Migration"
}
```

### Activity/Excursion Component
```json
{
  "id": "comp-004",
  "type": "activity",
  "category": "optional",
  "order": 5,
  "data": {
    "name": "Private Cooking Class",
    "provider": "Tuscany Culinary Experience",
    "location": "Florence, Italy",
    "date": "2026-06-18",
    "time": "10:00",
    "duration": "4 hours",
    "description": "Hands-on pasta making class with market tour",
    "included": ["Market tour", "Ingredients", "Wine pairing", "Recipe book"],
    "maxParticipants": 8,
    "price": 250,
    "pricePerPerson": 125
  },
  "notes": "Can accommodate dietary restrictions"
}
```

### Transfer Component
```json
{
  "id": "comp-005",
  "type": "transfer",
  "category": "main",
  "order": 1,
  "data": {
    "transferType": "airport_pickup",
    "from": "Florence Airport (FLR)",
    "to": "Luxury Villa, Tuscany",
    "date": "2026-06-15",
    "time": "14:00",
    "vehicleType": "Private car",
    "passengers": 2,
    "luggage": "4 bags",
    "duration": "1 hour",
    "price": 120,
    "driverName": "TBD",
    "driverPhone": "TBD"
  },
  "notes": "Driver will have name sign"
}
```

### Car Rental Component
```json
{
  "id": "comp-006",
  "type": "car_rental",
  "category": "main",
  "order": 2,
  "data": {
    "company": "Hertz",
    "vehicleClass": "Full-size SUV",
    "vehicleModel": "Similar to Toyota Highlander",
    "pickup": {
      "location": "Florence Airport",
      "date": "2026-06-15",
      "time": "14:00"
    },
    "dropoff": {
      "location": "Rome Fiumicino Airport",
      "date": "2026-06-22",
      "time": "10:00"
    },
    "days": 7,
    "inclusions": ["Unlimited mileage", "Full insurance", "GPS", "Additional driver"],
    "price": 650,
    "confirmationNumber": "ABC123XYZ"
  },
  "notes": "International driver's license required"
}
```

---

## ✅ REQUIRED FIELDS BY SECTION

### Metadata (ALL Required)
- `tripTitle`
- `clientName`
- `startDate`
- `endDate`
- `guests`

### Pricing (Required)
- `grandTotal`

### Flights (If Present)
- `airline`
- `departure.airport`
- `departure.date`
- `arrival.airport`
- `arrival.date`

### Hotels (If Present)
- `name`
- `location`
- `checkIn`
- `checkOut`
- `roomType`

### Cruise (If Present)
- `cruiseLine`
- `shipName`
- `itinerary`
- `embarkation.port`
- `embarkation.date`
- `disembarkation.port`
- `disembarkation.date`
- `nights`
- `cabinCategory`

### Components (If Present)
- `id`
- `type`
- `order`
- `data` (component-specific fields)

---

## 📊 DATA TYPE REFERENCE

| Field Type | Format | Example |
|------------|--------|---------|
| Date | YYYY-MM-DD | "2026-06-15" |
| Time | HH:MM (24-hour) | "14:30" |
| Timestamp | ISO 8601 | "2025-11-18T14:30:00Z" |
| Price | number (no $ or ,) | 13594 |
| Airport Code | 3-letter IATA | "JFK" |
| Phone | string | "+1 (555) 123-4567" |
| Email | string | "damon@trnttravel.com" |
| URL | string | "https://www.vrbo.com/..." |
| Emoji | Unicode escape | "\\u{1F6A2}" (ship) |

---

## 🔄 MIGRATION FROM v2.0 TO v3.0

### Key Changes:
1. ✅ Added `displayMetadata` section (auto-generated)
2. ✅ Added optional `components` array for complex trips
3. ✅ Standardized date formats (all YYYY-MM-DD)
4. ✅ Added `roomType` field to hotels
5. ✅ Added `amenities` arrays to hotels
6. ✅ Added `category` field to hotels (pre-trip, main, post-trip)
7. ✅ Added `order` field to components
8. ✅ Added `externalLink` field for VRBO/Airbnb/etc.
9. ✅ Consistent `price` and `pricePerPerson` fields across all components

### Backward Compatibility:
- All v2.0 fields remain valid in v3.0
- New fields are optional (except `displayMetadata` which is auto-generated)
- Tools check for v3.0 fields first, fall back to v2.0 equivalents
- Migration utility in `trnt-utils.js` handles conversion

---

## 🎯 USAGE GUIDELINES

### When to Use Simple Structure (flights/hotels/cruise):
✅ Flight + Cruise  
✅ Flight + Hotel  
✅ Flight + Cruise + Pre/Post Hotels  
✅ 95% of typical bookings

### When to Use Components Array:
✅ VRBO/Airbnb properties (with external links)  
✅ Multi-leg trips (flight + train + safari + hotel)  
✅ Complex itineraries (5+ different components)  
✅ "Presentation only" options (showing but not booking)  
✅ Non-standard trip types (expedition, culinary tour, etc.)

### Best Practices:
1. **Start simple** - Use top-level fields when possible
2. **Add complexity only when needed** - Use components for edge cases
3. **Be consistent** - All dates YYYY-MM-DD, all prices as numbers
4. **Use auto-generation** - Let utilities create displayMetadata
5. **Document edge cases** - Use notes fields liberally

---

## 🧪 VALIDATION CHECKLIST

Before saving a trip option, validate:

- [ ] All required metadata fields present
- [ ] Dates in YYYY-MM-DD format
- [ ] Start date before end date
- [ ] All prices are numbers (no $ or commas)
- [ ] At least one trip component (flight, hotel, cruise, or component)
- [ ] Grand total calculated correctly
- [ ] Airport codes are 3 letters
- [ ] Component IDs are unique (if using components)
- [ ] Component order is sequential (if using components)
- [ ] External links are valid URLs (if present)

---

## 📝 EXAMPLE: Simple Trip (Flight + Cruise)

```json
{
  "metadata": {
    "tripTitle": "Romantic Danube River Cruise",
    "clientName": "John and Jane Smith",
    "startDate": "2026-06-15",
    "endDate": "2026-06-27",
    "guests": 2,
    "createdDate": "2025-11-18T15:30:00Z",
    "lastModified": "2025-11-18T15:30:00Z",
    "version": "3.0.0",
    "tripType": "cruise",
    "destination": "Danube River"
  },
  "overview": {
    "summary": "12-night romantic cruise through the heart of Europe",
    "vendor": "AmaWaterways",
    "tripType": "river_cruise",
    "highlights": [
      "Grand Suite with private balcony",
      "All meals and beverages included",
      "Exclusive shore excursions",
      "Personalized service"
    ]
  },
  "pricing": {
    "packageTotal": 13594,
    "flightsTotal": 1678,
    "grandTotal": 15272,
    "perPerson": 7636,
    "currency": "USD"
  },
  "flights": [
    {
      "type": "outbound",
      "airline": "United Airlines",
      "flightNumber": "UA123",
      "departure": {
        "airport": "JFK",
        "city": "New York",
        "date": "2026-06-15",
        "time": "18:00"
      },
      "arrival": {
        "airport": "VIE",
        "city": "Vienna",
        "date": "2026-06-16",
        "time": "08:30"
      },
      "cabin": "Business",
      "price": 839,
      "pricePerPerson": 839
    },
    {
      "type": "return",
      "airline": "United Airlines",
      "flightNumber": "UA456",
      "departure": {
        "airport": "BUD",
        "city": "Budapest",
        "date": "2026-06-27",
        "time": "11:00"
      },
      "arrival": {
        "airport": "JFK",
        "city": "New York",
        "date": "2026-06-27",
        "time": "15:30"
      },
      "cabin": "Business",
      "price": 839,
      "pricePerPerson": 839
    }
  ],
  "hotels": [],
  "cruise": {
    "cruiseLine": "AmaWaterways",
    "shipName": "AmaMagna",
    "cruiseType": "river",
    "itinerary": "Vienna to Budapest via Danube River",
    "embarkation": {
      "port": "Vienna",
      "city": "Vienna",
      "date": "2026-06-16",
      "time": "16:00"
    },
    "disembarkation": {
      "port": "Budapest",
      "city": "Budapest",
      "date": "2026-06-27",
      "time": "09:00"
    },
    "nights": 11,
    "cabinCategory": "Grand Suite",
    "cabinDescription": "Spacious suite with private balcony and seating area",
    "deck": "Deck 3",
    "cabinFeatures": ["Balcony", "Suite", "Premium location"],
    "inclusions": [
      "All meals",
      "Unlimited beverages",
      "Shore excursions in every port",
      "Gratuities included",
      "WiFi"
    ],
    "price": 13594,
    "pricePerPerson": 6797
  },
  "preTrip": null,
  "postTrip": null,
  "components": [],
  "displayMetadata": {
    "title": "AmaWaterways AmaMagna",
    "subtitle": "Grand Suite · Jun 16-27, 2026",
    "label": "Best Value",
    "dates": {
      "display": "Jun 16-27, 2026",
      "start": "2026-06-16",
      "end": "2026-06-27"
    },
    "emoji": "\\u{1F6A2}"
  }
}
```

---

## 📝 EXAMPLE: Complex Trip (Flight + VRBO + Activities)

```json
{
  "metadata": {
    "tripTitle": "Tuscany Culinary Adventure",
    "clientName": "Mark and Lisa Johnson",
    "startDate": "2026-09-10",
    "endDate": "2026-09-17",
    "guests": 2,
    "createdDate": "2025-11-18T16:00:00Z",
    "lastModified": "2025-11-18T16:00:00Z",
    "version": "3.0.0",
    "tripType": "independent",
    "destination": "Tuscany, Italy"
  },
  "overview": {
    "summary": "Week-long culinary and wine experience in Tuscany",
    "vendor": "Multiple",
    "tripType": "independent",
    "highlights": [
      "Private villa with chef",
      "Cooking classes and wine tastings",
      "Flexible schedule",
      "Authentic Tuscan experience"
    ]
  },
  "pricing": {
    "flightsTotal": 2400,
    "additionalCosts": 4650,
    "grandTotal": 7050,
    "perPerson": 3525,
    "currency": "USD"
  },
  "flights": [
    {
      "type": "outbound",
      "airline": "Delta",
      "departure": {
        "airport": "JFK",
        "date": "2026-09-10"
      },
      "arrival": {
        "airport": "FLR",
        "date": "2026-09-11"
      },
      "cabin": "Economy",
      "price": 1200,
      "pricePerPerson": 1200
    },
    {
      "type": "return",
      "airline": "Delta",
      "departure": {
        "airport": "FLR",
        "date": "2026-09-17"
      },
      "arrival": {
        "airport": "JFK",
        "date": "2026-09-17"
      },
      "cabin": "Economy",
      "price": 1200,
      "pricePerPerson": 1200
    }
  ],
  "hotels": [],
  "cruise": null,
  "preTrip": null,
  "postTrip": null,
  "components": [
    {
      "id": "comp-001",
      "type": "transfer",
      "category": "main",
      "order": 1,
      "data": {
        "transferType": "airport_pickup",
        "from": "Florence Airport",
        "to": "Villa Rental",
        "date": "2026-09-11",
        "vehicleType": "Private car",
        "price": 120
      },
      "externalLink": null
    },
    {
      "id": "comp-002",
      "type": "vrbo",
      "category": "main",
      "order": 2,
      "data": {
        "propertyName": "Casa Bella Vista",
        "location": "Chianti Region, Tuscany",
        "checkIn": "2026-09-11",
        "checkOut": "2026-09-17",
        "nights": 6,
        "bedrooms": 3,
        "bathrooms": 2,
        "maxGuests": 6,
        "amenities": ["Pool", "Chef available", "Wine cellar", "Garden", "WiFi"],
        "pricePerNight": 400,
        "totalPrice": 2400
      },
      "externalLink": "https://www.vrbo.com/1234567",
      "presentationOnly": true,
      "notes": "Client will book directly - shown for reference"
    },
    {
      "id": "comp-003",
      "type": "activity",
      "category": "optional",
      "order": 3,
      "data": {
        "name": "Private Cooking Class",
        "location": "At villa",
        "date": "2026-09-13",
        "duration": "4 hours",
        "description": "Hands-on pasta and sauce making",
        "price": 350,
        "pricePerPerson": 175
      },
      "notes": "Chef Gianni - highly recommended"
    },
    {
      "id": "comp-004",
      "type": "activity",
      "category": "optional",
      "order": 4,
      "data": {
        "name": "Chianti Winery Tour",
        "location": "Castello di Brolio",
        "date": "2026-09-14",
        "duration": "6 hours",
        "description": "Private tour with tastings and lunch",
        "price": 480,
        "pricePerPerson": 240
      },
      "externalLink": "https://www.castellodibrolio.it"
    },
    {
      "id": "comp-005",
      "type": "activity",
      "category": "optional",
      "order": 5,
      "data": {
        "name": "Truffle Hunting Experience",
        "location": "San Miniato",
        "date": "2026-09-15",
        "duration": "5 hours",
        "description": "Hunt for truffles with expert and his dog",
        "price": 420,
        "pricePerPerson": 210
      }
    },
    {
      "id": "comp-006",
      "type": "transfer",
      "category": "main",
      "order": 6,
      "data": {
        "transferType": "airport_dropoff",
        "from": "Villa Rental",
        "to": "Florence Airport",
        "date": "2026-09-17",
        "vehicleType": "Private car",
        "price": 120
      },
      "externalLink": null
    }
  ],
  "displayMetadata": {
    "title": "Tuscany Culinary Adventure",
    "subtitle": "Private Villa · Sep 11-17, 2026",
    "label": "",
    "dates": {
      "display": "Sep 11-17, 2026",
      "start": "2026-09-11",
      "end": "2026-09-17"
    }
  }
}
```

---

## 🚀 IMPLEMENTATION NOTES

### For Tool Developers:
1. Always check for `displayMetadata` first - it's auto-generated and optimized for display
2. Use `TRNTUtils.Migration.migrateToV3()` for backward compatibility
3. Validate all data with `TRNTUtils.Validation.validateTripOption()`
4. Use `TRNTUtils.Date.*` and `TRNTUtils.Price.*` for consistent formatting
5. Check `components` array - if populated, prioritize it over top-level fields for display

### For AI JSON Builder:
1. Default to simple structure (flights/hotels/cruise) for 95% of cases
2. Use components array only when:
   - Client mentions VRBO/Airbnb
   - Trip has non-standard components (train, safari, etc.)
   - "Presentation only" scenarios
3. Always generate `displayMetadata` using `TRNTUtils.Metadata.generateDisplayMetadata()`
4. Set `presentationOnly: true` for external bookings
5. Include `externalLink` for properties client will book directly

### For Data Entry:
1. Start with required metadata fields
2. Add pricing (at minimum `grandTotal`)
3. Add main trip components (flight, hotel, or cruise)
4. Use components array only for complex scenarios
5. Let utilities auto-generate displayMetadata

---

## 📚 RELATED DOCUMENTATION

- `trnt-utils.js` - Utility functions for working with this format
- `MIGRATION-GUIDE.md` - Step-by-step migration from v2.0
- `VALIDATION-RULES.md` - Complete validation specifications
- `COMPONENT-LIBRARY.md` - All supported component types

---

## 🔄 VERSION HISTORY

**v3.0.0** (November 18, 2025)
- Initial unified format specification
- Added components array for flexibility
- Added displayMetadata for auto-generation
- Standardized all date/price formats
- Added support for all trip types

---

**Last Updated:** November 18, 2025  
**Maintained By:** TRNT Travel Tools Development Team
