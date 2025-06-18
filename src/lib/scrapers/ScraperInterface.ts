export interface ScraperInterface {
  shopName: string;
  targetUrl: string;
  scrapeProducts(): Promise<Product[]>;
}

export interface Product {
  productName: string;
  productImageUrl: string;
  price: number;
  discountedPrice?: number;
  shopName: string;
}

export interface ScrapingResult {
  success: boolean;
  products: Product[];
  error?: string;
  productsCount: number;
}