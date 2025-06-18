import { Layout } from '@/components/layout/Layout';
import { ProductTable } from '@/components/ProductTable';
import { mockProducts } from '@/data/products';
import { Package, TrendingUp, Store } from 'lucide-react';

export default function Home() {
  const totalProducts = mockProducts.length;
  const totalShops = new Set(mockProducts.map(p => p.shopName)).size;
  const onSaleProducts = mockProducts.filter(p => p.discountedPrice).length;

  return (
    <Layout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            全ショップの商品一覧
          </h1>
          <p className="text-gray-600">
            すべてのショップから取得した商品データを一覧で確認できます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">総商品数</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Store className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">連携ショップ数</p>
                <p className="text-2xl font-bold text-gray-900">{totalShops}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">セール商品</p>
                <p className="text-2xl font-bold text-gray-900">{onSaleProducts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品一覧テーブル */}
        <ProductTable products={mockProducts} />
      </div>
    </Layout>
  );
}