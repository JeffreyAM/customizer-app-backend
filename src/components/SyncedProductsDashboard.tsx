//SyncProductsDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { Toaster } from "react-hot-toast";
import SyncedProductsList from "./SyncedProductsList";
import Header from "./Header";


export default function SyncProductsDashboard() {
    const { user, signOut } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
            <Toaster />
            <Header />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                    <h2 className="text-lg font-medium text-gray-900">Your Synced Products</h2>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Synced Products</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Saved Designs ({products.length} total)</p>
                        </div>
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading Products...</div>
                        ) : (
                            <SyncedProductsList 
                                products={products} 
                                onProductClick={(product) => { console.log("Mock click handler: ", product) }}
                              
                            />
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
