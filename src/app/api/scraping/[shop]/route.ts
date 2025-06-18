import { NextRequest, NextResponse } from 'next/server';
import { VTCosmeticsScraper } from '@/lib/scrapers/official/VTCosmeticsScraper';
import { NatureLabScraper } from '@/lib/scrapers/official/NatureLabScraper';
import { MujiScraper } from '@/lib/scrapers/official/MujiScraper';
import { ScraperInterface, ScrapingResult } from '@/lib/scrapers/ScraperInterface';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { shop: string } }
) {
  const { shop } = params;

  let scraper: ScraperInterface;

  switch (shop) {
    case 'vt-cosmetics':
      scraper = new VTCosmeticsScraper();
      break;
    case 'naturelab':
      scraper = new NatureLabScraper();
      break;
    case 'muji':
      scraper = new MujiScraper();
      break;
    default:
      return NextResponse.json({
        success: false,
        products: [],
        error: 'Unknown shop',
        productsCount: 0
      }, { status: 400 });
  }

  try {
    const products = await scraper.scrapeProducts();
    
    // Supabaseにデータを保存
    if (products.length > 0) {
      const { error } = await supabase
        .from('products')
        .upsert(
          products.map(product => ({
            shop_name: product.shopName,
            product_name: product.productName,
            product_image_url: product.productImageUrl,
            price: product.price,
            discounted_price: product.discountedPrice,
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'shop_name,product_name',
            ignoreDuplicates: false 
          }
        );

      if (error) {
        console.error('Supabase保存エラー:', error);
        return NextResponse.json({
          success: false,
          products: [],
          error: 'データベース保存に失敗しました',
          productsCount: 0
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      products,
      productsCount: products.length
    });
  } catch (error) {
    console.error(`スクレイピングエラー (${shop}):`, error);
    
    return NextResponse.json({
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      productsCount: 0
    }, { status: 500 });
  }
}