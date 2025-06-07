import { NextApiRequest, NextApiResponse } from 'next';
import { VTCosmeticsScraper } from '@/lib/scrapers/official/VTCosmeticsScraper';
import { NatureLabScraper } from '@/lib/scrapers/official/NatureLabScraper';
import { MujiScraper } from '@/lib/scrapers/official/MujiScraper';
import { ScraperInterface, ScrapingResult } from '@/lib/scrapers/ScraperInterface';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScrapingResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      products: [],
      error: 'Method not allowed',
      productsCount: 0
    });
  }

  const { shop } = req.query;

  if (typeof shop !== 'string') {
    return res.status(400).json({
      success: false,
      products: [],
      error: 'Invalid shop parameter',
      productsCount: 0
    });
  }

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
      return res.status(400).json({
        success: false,
        products: [],
        error: 'Unknown shop',
        productsCount: 0
      });
  }

  try {
    const products = await scraper.scrapeProducts();
    
    // TODO: ここでSupabaseにデータを保存する処理を追加
    
    return res.status(200).json({
      success: true,
      products,
      productsCount: products.length
    });
  } catch (error) {
    console.error(`スクレイピングエラー (${shop}):`, error);
    
    return res.status(500).json({
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      productsCount: 0
    });
  }
}