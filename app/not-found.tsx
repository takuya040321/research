import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ページが見つかりません
            </h1>
            <p className="text-gray-600">
              お探しのページは存在しないか、移動された可能性があります。
            </p>
          </div>
          
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                ホームに戻る
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="javascript:history.back()" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                前のページに戻る
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}