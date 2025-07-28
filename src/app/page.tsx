import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧵 Customizer App Backend
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Printful EDM Integration with Shopify
          </p>
          
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Open Dashboard
            </Link>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-left">
              <h3 className="font-semibold text-gray-900 mb-3">API Endpoints:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    POST /api/shopify/template
                  </code>
                  <br />
                  <span className="text-xs">Process saved design templates</span>
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    GET /api/templates
                  </code>
                  <br />
                  <span className="text-xs">Fetch saved design templates</span>
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    POST /api/save-customization
                  </code>
                  <br />
                  <span className="text-xs">Save product customizations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
