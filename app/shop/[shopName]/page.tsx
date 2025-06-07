import { Layout } from '@/components/layout/Layout';
import { ProductTable } from '@/components/ProductTable';
import { ScrapingButton } from '@/components/ScrapingButton';
import { mockProducts } from '@/data/products';
import { shops } from '@/data/shops';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, RefreshCw } from 'lucide-react';

interface ShopPageProps {
  params: {
    shopName: string;
  };
}

export default function ShopPage({ params }: ShopPageProps) {
  const shop = shops.find(s => s.slug === params.shopName);
  
  if (!shop) {
    notFound();
  }

  const shopProducts = mockProducts.filter(product => 
    product.shopName === shop.displayName
  );

  const lastUpdateTime = new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Layout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {shop.displayName}の商品一覧
            </h1>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
              公式
            </Badge>
          </div>
          <p className="text-gray-600 mb-6">
            {shop.displayName}から最新の商品データを取得・管理します
          </p>
          
          {/* スクレイピングボタン */}
          <div className="flex items-center gap-4">
            <ScrapingButton shopName={shop.displayName} />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              最終更新: {lastUpdateTime}
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">取得商品数</p>
                <p className="text-2xl font-bold text-gray-900">{shopProducts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <RefreshCw className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">取得ステータス</p>
                <p className="text-lg font-semibold text-emerald-600">正常</p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品一覧テーブル */}
        <ProductTable 
          products={mockProducts} 
          shopFilter={shop.displayName}
        />
      </div>
    </Layout>
  );
}

export async function generateStaticParams() {
  return shops.map((shop) => ({
    shopName: shop.slug,
  }));
}