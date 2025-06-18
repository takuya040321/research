'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, ChevronRight } from 'lucide-react';
import { shops } from '@/data/shops';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          スクレイピング管理
        </h1>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-4 py-6">
        {/* ホーム */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-6",
            pathname === '/' 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Home className="w-4 h-4" />
          Home
        </Link>

        {/* 公式セクション */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Store className="w-4 h-4" />
            公式（オフィシャル）
          </div>
          
          <div className="ml-4 space-y-1">
            {shops.map((shop) => (
              <Link
                key={shop.slug}
                href={`/shop/${shop.slug}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                  pathname === `/shop/${shop.slug}`
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span>{shop.displayName}</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* フッター */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2025 スクレイピング管理システム
        </p>
      </div>
    </div>
  );
}