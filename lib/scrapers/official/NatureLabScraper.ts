import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScraperInterface, Product, ScrapingResult } from '../ScraperInterface';

export class NatureLabScraper implements ScraperInterface {
  shopName = 'ネイチャーラボ';
  targetUrl = 'https://store.naturelab.co.jp/';

  async scrapeProducts(): Promise<Product[]> {
    try {
      const response = await axios.get(this.targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const products: Product[] = [];

      // ネイチャーラボの商品要素を選択（実際のセレクターは要調整）
      $('.product-item, .item, .product, .goods-item').each((index, element) => {
        try {
          const $element = $(element);
          
          // 商品名を取得
          const productName = $element.find('.product-name, .item-name, .goods-name, h3, h4').first().text().trim();
          
          // 商品画像URLを取得
          let productImageUrl = $element.find('img').first().attr('src') || '';
          if (productImageUrl && !productImageUrl.startsWith('http')) {
            productImageUrl = new URL(productImageUrl, this.targetUrl).href;
          }
          
          // 価格を取得
          const priceText = $element.find('.price, .cost, .amount, .goods-price').first().text().trim();
          const price = this.extractPrice(priceText);
          
          // 割引価格を取得
          const discountPriceText = $element.find('.sale-price, .discount-price, .special-price').first().text().trim();
          const discountedPrice = discountPriceText ? this.extractPrice(discountPriceText) : undefined;

          if (productName && productImageUrl && price > 0) {
            products.push({
              productName,
              productImageUrl,
              price,
              discountedPrice,
              shopName: this.shopName
            });
          }
        } catch (error) {
          console.error('商品データ解析エラー:', error);
        }
      });

      return products;
    } catch (error) {
      console.error('ネイチャーラボ スクレイピングエラー:', error);
      throw new Error(`スクレイピングに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractPrice(priceText: string): number {
    const cleanText = priceText.replace(/[^\d]/g, '');
    return parseInt(cleanText) || 0;
  }
}