import { VTCosmeticsScraper } from '../lib/scrapers/official/VTCosmeticsScraper';

async function testScraper() {
  try {
    console.log('Starting VTCosmetics scraper test...');
    const scraper = new VTCosmeticsScraper();
    
    console.log('Scraping products...');
    const products = await scraper.scrapeProducts();
    
    console.log('\nScraping completed! Found products:', products.length);
    
    // Display the first 3 products as a sample
    console.log('\nSample products:');
    products.slice(0, 3).forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log('Name:', product.productName);
      console.log('Price:', product.price);
      if (product.discountedPrice) {
        console.log('Discounted Price:', product.discountedPrice);
      }
      console.log('Image URL:', product.productImageUrl);
    });
    
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

testScraper();
