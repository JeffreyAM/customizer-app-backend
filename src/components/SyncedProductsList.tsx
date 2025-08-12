import { Product } from "@/types/syncedProducts";
import ProductCard from "./ProductCard";
import axios from "axios";

interface Props {
  products: Product[];
  onProductClick: (product: Product) => void;
}
export default function SyncedProductsList({ products, onProductClick}: Props) {
  if (products.length === 0) {
    return <div className="text-center py-12 text-gray-500">No Synced Products found.</div>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} onClick={onProductClick} />
      ))}
    </ul>
  );
}