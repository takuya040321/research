export interface Product {
  productName: string;
  productImageUrl: string;
  price: number;
  discountedPrice?: number;
  shopName: string;
}

export interface Shop {
  name: string;
  slug: string;
  displayName: string;
}