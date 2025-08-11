import { Product } from "@/types/syncedProducts";

interface Props {
    product: Product;
    onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: Props) {
    return (
        <li
            key={product.id}
            className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onClick(product)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {product.thumbnail_url && (
                        <img src={product.thumbnail_url} alt={product.name} className="h-16 w-16 rounded-lg object-cover mr-4" />
                    )}
                    <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">Product ID: {product.external_id}</p>
                        <div className="flex gap-2">
                            <p className="text-sm text-gray-500">Synced: {
                                product.synced ? "Yes" : "No"
                            }</p>

                            <p className="text-sm text-gray-500">Is Ignored: {
                                product.is_ignored ? "Yes" : "No"
                            }</p>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 text-sm text-gray-500">
                    {product.variants} variants
                </div>
            </div>
        </li>
    )
}
