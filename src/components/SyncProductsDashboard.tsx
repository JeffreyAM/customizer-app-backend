import { useEffect, useState } from "react";

export default function SyncProductsDashboard() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSyncedProducts = async () => {
        try {
            const response = await fetch(`/api/printful/sync/products`);
            const data = await response.json();
            console.log("Response from /sync/products:", data);
            setProducts(data.result || []);
        } catch (err) {
            console.error("Error fetching synced products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSyncedProducts();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Synced Products Dashboard
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-lg font-medium text-gray-900">Your Synced Products</h2>

                    {loading ? (
                        <p className="mt-4 text-gray-500">Loading...</p>
                    ) : products.length === 0 ? (
                        <p className="mt-4 text-gray-500">No synced products found.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-black">Image</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-black">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-black">
                                            Shopify Product ID
                                        </th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-black">
                                            Printful Product ID
                                        </th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product: any) => (
                                        <tr key={product.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                {product.thumbnail_url ? (
                                                    <img
                                                        src={product.thumbnail_url}
                                                        alt={product.name}
                                                        className="h-12 w-12 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 bg-gray-200 rounded"></div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-black ">{product.name}</td>
                                            <td className="px-4 py-2 text-black">{product.external_id}</td>
                                            <td className="px-4 py-2  text-black">{product.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
