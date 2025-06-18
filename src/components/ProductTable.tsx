'use client';

import Image from 'next/image';
import { Product } from '@/types/product';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ProductTableProps {
  products: Product[];
  shopFilter?: string;
}

export function ProductTable({ products, shopFilter }: ProductTableProps) {
  const filteredProducts = shopFilter 
    ? products.filter(product => product.shopName === shopFilter)
    : products;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-20">画像</TableHead>
            <TableHead className="font-semibold">商品名</TableHead>
            <TableHead className="w-32 font-semibold">現在価格</TableHead>
            {!shopFilter && (
              <TableHead className="w-24 font-semibold">ショップ</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={shopFilter ? 3 : 4} 
                className="text-center py-8 text-gray-500"
              >
                商品データがありません
              </TableCell>
            </TableRow>
          ) : (
            filteredProducts.map((product, index) => (
              <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={product.productImageUrl}
                      alt={product.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 line-clamp-2">
                    {product.productName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {product.discountedPrice ? (
                      <>
                        <div className="text-lg font-bold text-red-600">
                          {formatPrice(product.discountedPrice)}
                        </div>
                        <div className="text-sm text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </div>
                      </>
                    ) : (
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </div>
                    )}
                  </div>
                </TableCell>
                {!shopFilter && (
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {product.shopName}
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}