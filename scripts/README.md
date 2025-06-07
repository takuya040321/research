# VTCosmetics Scraper

This script scrapes product information from the VTCosmetics official online shop.

## Features

- Scrapes product names, prices, and image URLs from VTCosmetics
- Handles pagination automatically
- Includes error handling and rate limiting
- Extracts both regular and discounted prices

## Prerequisites

- Node.js 16+
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Run the test script:

```bash
ts-node scripts/test-vtcosmetics-scraper.ts
```

## Usage

```typescript
import { VTCosmeticsScraper } from '../lib/scrapers/official/VTCosmeticsScraper';

async function main() {
  const scraper = new VTCosmeticsScraper();
  const products = await scraper.scrapeProducts();
  console.log(products);
}

main();
```

## Output Format

The scraper returns an array of Product objects with the following structure:

```typescript
interface Product {
  productName: string;      // Product name
  productImageUrl: string;  // URL of the product image
  price: number;            // Regular price
  discountedPrice?: number; // Discounted price (if available)
  shopName: string;        // Always 'VTCosmetics'
}
```

## Rate Limiting

The script includes a 1-second delay between page requests to avoid overloading the server.

## Error Handling

The script includes error handling for:
- Network errors
- Missing or malformed data
- Timeouts

## License

MIT
