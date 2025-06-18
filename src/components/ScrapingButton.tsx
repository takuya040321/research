'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface ScrapingButtonProps {
  shopName: string;
  shopSlug: string;
}

export function ScrapingButton({ shopName, shopSlug }: ScrapingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleScraping = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(`/api/scraping/${shopSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(`${result.productsCount}件の商品データを取得しました`);
      } else {
        setStatus('error');
        setMessage(result.error || 'スクレイピングに失敗しました');
      }
    } catch (error) {
      setStatus('error');
      setMessage('ネットワークエラーが発生しました');
      console.error('スクレイピングエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          スクレイピング中...
        </>
      );
    }

    if (status === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          取得完了
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          再試行
        </>
      );
    }

    return (
      <>
        <Download className="w-4 h-4 mr-2" />
        {shopName}のデータ取得
      </>
    );
  };

  const getButtonColor = () => {
    if (status === 'success') {
      return 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700';
    }
    if (status === 'error') {
      return 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700';
    }
    return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700';
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleScraping}
        disabled={isLoading}
        className={`${getButtonColor()} text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200`}
      >
        {getButtonContent()}
      </Button>
      
      {message && (
        <div className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
}