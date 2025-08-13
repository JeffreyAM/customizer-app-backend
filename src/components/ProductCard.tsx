
import { ShopifyProductsResponse } from "@/types";
import { PrintfulProductSync } from "@/types";
import { cleanShopifyId } from "@/utils/common";

interface Props {
  product: ShopifyProductsResponse["products"]["nodes"][number];
  printfulSyncedProducts: PrintfulProductSync[];
  onClick: (product: PrintfulProductSync) => void;
}

async function handleSyncNow(product: PrintfulProductSync) {
  try {
    const response = await fetch("/api/sync-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopifyProductID: product.external_id,
        edmTemplateId: product.edmTemplateId, // not sure  pa to
        printfulProductId: product.printfulId, // not sure  pa to
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log("Product synced successfully:", data);
    } else {
      console.error("Error syncing product:", data);
    }
  } catch (error) {
    console.error("Network Error:", error);
  }
}
export default function ProductCard({ product, printfulSyncedProducts, onClick }: Props) {
  const syncedProduct = printfulSyncedProducts.find((p) => p.external_id === product.id);

  const isSynced =
    syncedProduct?.synced === syncedProduct?.variants && syncedProduct?.variants === product.variantsCount.count;

  console.log("----------------------------------------");
  console.log(syncedProduct);

  console.log(syncedProduct?.synced);
  console.log(syncedProduct?.variants);
  console.log(product.variantsCount.count);

  return (
    <li className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={product.media?.nodes[0]?.preview?.image?.url}
            alt={product.media?.nodes[0]?.alt}
            className="h-16 w-16 rounded-lg object-cover mr-4"
          />
          <div>
            <p className="text-sm font-medium text-indigo-600 truncate">{product.title}</p>
            <p className="text-sm text-gray-500">Shopify Product ID: {cleanShopifyId(product.id)}</p>
            <p className="text-sm text-gray-500">Printful Product ID: {syncedProduct?.id || "-"}</p>
          </div>
        </div>

        <div className="flex-shrink-0 text-sm text-gray-500">
          <div className="flex-shrink-0 text-sm text-gray-500 flex flex-col items-end gap-2">
            {/* <span>{product.variants} variants</span> */}
            <p
              className={`text-sm py-0.5 px-2 rounded-xl ${
                isSynced ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
              }`}
            >
              {isSynced ? "Synced" : "Unsynced"}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
