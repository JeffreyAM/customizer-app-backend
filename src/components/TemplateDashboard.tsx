'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Template } from '@/lib/supabase';

export default function TemplateDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Template Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Printful Templates
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Templates fetched from Shopify integration ({templates.length} total)
              </p>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  No templates found. Templates will appear here when received from Shopify.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <li key={template.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {template.image_url && (
                          <img
                            className="h-16 w-16 rounded-lg object-cover mr-4"
                            src={template.image_url}
                            alt={template.product_title}
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {template.product_title}
                          </p>
                          <p className="text-sm text-gray-500">
                            Template ID: {template.template_id}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(template.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="text-sm text-gray-500">
                          {Object.keys(template.variant_options || {}).length} variants
                        </div>
                      </div>
                    </div>
                    
                    {template.variant_options && Object.keys(template.variant_options).length > 0 && (
                      <div className="mt-2 ml-20">
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">
                            View variant options
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(template.variant_options, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                API Integration
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Send POST requests to <code className="bg-gray-100 px-1 rounded">/api/shopify/template</code> with:
                </p>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs">
{`{
  "templateId": "your-template-id",
  "userId": "${user?.id || 'optional-user-id'}"
}`}
                </pre>
              </div>
              <div className="mt-3">
                <button
                  onClick={fetchTemplates}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Refresh Templates
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}