'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

interface ScrapingButtonProps {
  shopName: string;
}

export function ScrapingButton({ shopName }: ScrapingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleScraping = async () => {
    setIsLoading(true);
    // TODO: 実際のスクレイピング処理を実装
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Button 
      onClick={handleScraping}
      disabled={isLoading}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {isLoading ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          スクレイピング中...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {shopName}のデータ取得
        </>
      )}
    </Button>
  );
}