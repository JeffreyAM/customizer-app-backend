'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Template } from '@/lib/supabase';

export default function TemplateDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userDetails, setUserDetails] = useState<{name: string, email: string} | null>(null);
  const [completeTemplateData, setCompleteTemplateData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
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

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUserDetails(userData.user);
      } else {
        console.error('Failed to fetch user details');
        setUserDetails(null);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserDetails(null);
    }
  };

  const fetchCompleteTemplateData = async (templateId: string) => {
    try {
      const response = await fetch(`https://customizer-app-backend.vercel.app/api/printful/product-templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setCompleteTemplateData(data);
      } else {
        console.error('Failed to fetch complete template data');
        setCompleteTemplateData(null);
      }
    } catch (error) {
      console.error('Error fetching complete template data:', error);
      setCompleteTemplateData(null);
    }
  };

  const handleTemplateClick = async (template: Template) => {
    setSelectedTemplate(template);
    setShowModal(true);
    setModalLoading(true);
    setUserDetails(null);
    setCompleteTemplateData(null);

    // Fetch user details if user_id exists
    if (template.user_id) {
      await fetchUserDetails(template.user_id);
    }

    // Fetch complete template data from Printful API
    await fetchCompleteTemplateData(template.template_id);

    setModalLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setUserDetails(null);
    setCompleteTemplateData(null);
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
                Welcome, Admin
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
                Printful Saved Designs
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Saved Designs ({templates.length} total)
              </p>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  No Saved Designs found. Saved Designs will appear here when received from Shopify.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <li 
                    key={template.id} 
                    className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTemplateClick(template)}
                  >
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
                  Send POST requests to <code className="bg-gray-100 px-1 rounded">/api/shopify/template</code> from Shopify with:
                </p>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs">
{`{
  "templateId": "your-template-id"
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

      {/* Modal */}
      {showModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Template Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Template Image */}
                {selectedTemplate.image_url && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Mockup Image</h4>
                    <img
                      className="w-full h-78 object-contain rounded-lg border"
                      src={selectedTemplate.image_url}
                      alt={selectedTemplate.product_title}
                    />
                  </div>
                )}
                
                {/* Template Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Template Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Product Title:</span>
                      <p className="text-gray-900">{selectedTemplate.product_title}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Template ID:</span>
                      <p className="text-gray-900 font-mono text-xs">{selectedTemplate.template_id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Created:</span>
                      <p className="text-gray-900">{formatDate(selectedTemplate.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Updated:</span>
                      <p className="text-gray-900">{formatDate(selectedTemplate.updated_at)}</p>
                    </div>
                    {selectedTemplate.user_id && (
                      <div>
                        <span className="font-medium text-gray-600">User:</span>
                        {modalLoading ? (
                          <p className="text-gray-500 text-sm">Loading user details...</p>
                        ) : userDetails ? (
                          <div className="text-gray-900">
                            <p className="font-medium">{userDetails.name}</p>
                            <p className="text-sm text-gray-600">{userDetails.email}</p>
                            <p className="text-xs text-gray-400 font-mono">ID: {selectedTemplate.user_id}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">User details not available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Complete Template Data from Printful */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Complete Template Data (from Printful API)</h4>
                {modalLoading ? (
                  <div className="bg-gray-50 p-4 rounded-lg border flex items-center justify-center">
                    <p className="text-gray-500 text-sm">Loading complete template data...</p>
                  </div>
                ) : completeTemplateData ? (
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border max-h-64 text-gray-500">
                    {JSON.stringify(completeTemplateData, null, 2)}
                  </pre>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-500 text-sm">Complete template data not available</p>
                  </div>
                )}
              </div>

              {/* Local Template Data */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Local Template Data</h4>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border max-h-64 text-gray-500">
                  {JSON.stringify(selectedTemplate, null, 2)}
                </pre>
              </div>
              
              {/* Variant Options */}
              {selectedTemplate.variant_options && Object.keys(selectedTemplate.variant_options).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Variant Options</h4>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border text-gray-500">
                    {JSON.stringify(selectedTemplate.variant_options, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}