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
                            <p className="text-sm text-gray-500 bg-gray-200 py-0.5 px-2 rounded-2xl">{product.synced ? "Synced" : "Not Synced"}</p>
                            <p className="text-sm text-gray-500 bg-gray-200 py-0.5 px-2 rounded-2xl">{product.is_ignored ? "Ignored" : "Not Ignored"}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 text-sm text-gray-500">

                    <div className="flex-shrink-0 text-sm text-gray-500 flex flex-col items-end gap-2">
                        <span>{product.variants} variants</span>
                        {product.synced ? (
                            <button
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    //  unsync handler 
                                    console.log("Unsyncing product:", product.id);
                                }}
                            >
                                Unsync
                            </button>
                        ) : (
                            <button
                                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // sync handler
                                    console.log("Syncing product:", product.id);
                                }}
                            >
                                Sync
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </li>
    )
}
