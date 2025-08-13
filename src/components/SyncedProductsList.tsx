import { PrintfulProductSync } from "@/types/printful";
import { ShopifyProductsResponse } from "@/types/shopify";
import { cleanShopifyId } from "@/utils/common";
import ProductCard from "./ProductCard";

interface Props {
  products: ShopifyProductsResponse["products"]["nodes"];
  printfulSyncedProducts: PrintfulProductSync[];
  onProductClick: (product: PrintfulProductSync) => void;
}
export default function SyncedProductsList({ products, printfulSyncedProducts, onProductClick }: Props) {
  if (products.length === 0) {
    return <div className="text-center py-12 text-gray-500">No Synced Products found.</div>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {products.map((product: any) => (
        <ProductCard
          key={cleanShopifyId(product.id)}
          product={product}
          printfulSyncedProducts={printfulSyncedProducts}
          onClick={onProductClick}
        />
      ))}
    </ul>
  );
}
