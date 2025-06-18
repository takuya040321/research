import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('商品取得エラー:', error);
      return NextResponse.json({
        success: false,
        products: [],
        error: 'データベースから商品を取得できませんでした'
      }, { status: 500 });
    }

    // データベースの形式をフロントエンド用に変換
    const formattedProducts = products?.map(product => ({
      productName: product.product_name,
      productImageUrl: product.product_image_url,
      price: product.price,
      discountedPrice: product.discounted_price,
      shopName: product.shop_name
    })) || [];

    return NextResponse.json({
      success: true,
      products: formattedProducts
    });
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json({
      success: false,
      products: [],
      error: 'サーバーエラーが発生しました'
    }, { status: 500 });
  }
}