
import { Product } from "@/types/syncedProducts";

interface Props {
    product: Product;
    onClick: (product: Product) => void;

}

async function handleSyncNow(product: Product) {
    try{
        const response = await fetch("/api/sync-product", {
            method: "POST",
            headers:{ "Content-Type": "application/json" },
            body: JSON.stringify({
                shopifyProductID: product.external_id,
                edmTemplateId: product.edmTemplateId, // not sure  pa to
                printfulProductId: product.printfulId // not sure  pa to
            }),
        });

        const data = await response.json();
        if(response.ok) {
            console.log("Product synced successfully:", data);
        }
        else{
            console.error("Error syncing product:", data);
        }
    }
    catch (error) {
        console.error("Network Error:", error);
    }   
}
export default function ProductCard({ product, onClick }: Props) {
    const isSynced = product.synced === product.variants;
    console.log(isSynced, product.synced, product.variants);
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
                    
                    </div>
                </div>

                <div className="flex-shrink-0 text-sm text-gray-500">

                    <div className="flex-shrink-0 text-sm text-gray-500 flex flex-col items-end gap-2">
                        <span>{product.variants} variants</span>
                        {!isSynced ? (
                            <button
                                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await handleSyncNow(product);
                                }}
                            >
                                Sync Now
                            </button>
                        ) : (
                            <p className="text-sm text-gray-500 bg-gray-200 py-0.5 px-2 rounded-2xl">Synced</p>
                        )}
                    </div>

                </div>
            </div>
        </li>
    )
}
